import type { DesktopAppCommand } from "@t3tools/contracts";

export type { DesktopAppCommand };

/** Runs a command only the desktop shell can carry out. A no-op on the web. */
export function runDesktopAppCommand(command: DesktopAppCommand): void {
  const runAppCommand = window.desktopBridge?.runAppCommand;
  if (typeof runAppCommand !== "function") return;
  void runAppCommand(command);
}
