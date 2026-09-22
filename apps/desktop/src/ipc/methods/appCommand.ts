import { DesktopAppCommandSchema } from "@t3tools/contracts";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";

import { makeComponentLogger } from "../../app/DesktopObservability.ts";
import * as ElectronApp from "../../electron/ElectronApp.ts";
import * as ElectronWindow from "../../electron/ElectronWindow.ts";
import { handleCheckForUpdatesRequest } from "../../window/DesktopApplicationMenu.ts";
import * as DesktopWindow from "../../window/DesktopWindow.ts";
import * as IpcChannels from "../channels.ts";
import * as DesktopIpc from "../DesktopIpc.ts";

const { logWarning: logAppCommandWarning } = makeComponentLogger("desktop-menu");

const decodeAppCommand = Schema.decodeUnknownEffect(DesktopAppCommandSchema);

/*
  Zoom never uses the Electron zoom roles: those act on whichever webContents
  has keyboard focus, so an embedded preview guest steals them. This is the
  same DesktopWindow.zoomMain path the native View menu uses.
*/
const ZOOM_DIRECTIONS = {
  "zoom-in": "in",
  "zoom-out": "out",
  "zoom-reset": "reset",
} as const satisfies Record<string, DesktopWindow.MainWindowZoomDirection>;

/**
 * Runs the shell-level commands the renderer-drawn menu bar cannot perform
 * itself. Unknown commands are logged and ignored rather than rejected, so a
 * newer client talking to an older shell degrades instead of throwing.
 */
export const runAppCommand = DesktopIpc.makeIpcMethod({
  channel: IpcChannels.RUN_APP_COMMAND_CHANNEL,
  payload: Schema.Unknown,
  result: Schema.Void,
  handler: Effect.fn("desktop.ipc.window.runAppCommand")(function* (raw) {
    const decoded = yield* Effect.option(decodeAppCommand(raw));
    if (Option.isNone(decoded)) {
      yield* logAppCommandWarning("ignoring unknown desktop app command", { command: raw });
      return;
    }
    const command = decoded.value;
    yield* Effect.annotateCurrentSpan({ command });

    if (command === "quit") {
      const electronApp = yield* ElectronApp.ElectronApp;
      yield* electronApp.quit;
      return;
    }
    if (command === "check-for-updates") {
      yield* handleCheckForUpdatesRequest;
      return;
    }
    if (command === "zoom-in" || command === "zoom-out" || command === "zoom-reset") {
      const desktopWindow = yield* DesktopWindow.DesktopWindow;
      yield* desktopWindow.zoomMain(ZOOM_DIRECTIONS[command]);
      return;
    }

    const electronWindow = yield* ElectronWindow.ElectronWindow;
    const main = yield* electronWindow.main;
    if (Option.isNone(main) || main.value.isDestroyed()) return;
    const window = main.value;
    yield* Effect.sync(() => {
      switch (command) {
        case "reload":
          window.webContents.reload();
          return;
        case "force-reload":
          window.webContents.reloadIgnoringCache();
          return;
        case "toggle-dev-tools":
          window.webContents.toggleDevTools();
          return;
        case "toggle-fullscreen":
          window.setFullScreen(!window.isFullScreen());
          return;
        case "close-window":
          window.close();
          return;
      }
    });
  }),
});
