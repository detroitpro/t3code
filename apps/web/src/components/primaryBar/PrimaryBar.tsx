import { useAtomValue } from "@effect/atom-react";
import { useEffect } from "react";

import { isElectron } from "../../env";
import {
  isRichTextBoldShortcut,
  resolveShortcutCommand,
  shortcutLabelForCommand,
} from "../../keybindings";
import { cn, isMacPlatform } from "../../lib/utils";
import { primaryServerKeybindingsAtom } from "../../state/server";
import { SidebarTrigger, useSidebar } from "../ui/sidebar";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../ui/tooltip";
import { AppMenuBar } from "./AppMenuBar";
import { subscribeAppCommand } from "./appCommandBus";
import { PrimaryBarBrand } from "./PrimaryBarBrand";
import { PrimaryBarDestinations } from "./PrimaryBarDestinations";
import { usePrimaryBarSlotRef } from "./primaryBarSlots";

function SidebarToggle() {
  const keybindings = useAtomValue(primaryServerKeybindingsAtom);
  const { toggleSidebar } = useSidebar();
  const shortcutLabel = shortcutLabelForCommand(keybindings, "sidebar.toggle");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (
        event.target instanceof HTMLElement &&
        event.target.closest("[data-keybinding-capture]")
      ) {
        return;
      }
      if (
        isRichTextBoldShortcut(event) &&
        event.target instanceof HTMLElement &&
        event.target.closest('[data-composer-rich-text="true"]')
      ) {
        // The rich-text composer claims Mod+B for bold; the toggle stays
        // available everywhere else, including the plain-text composer.
        return;
      }
      if (resolveShortcutCommand(event, keybindings) !== "sidebar.toggle") return;

      event.preventDefault();
      event.stopPropagation();
      toggleSidebar();
    };

    // Capture before focused editors consume commands such as Mod+B for rich-text formatting.
    window.addEventListener("keydown", onKeyDown, true);
    const unsubscribeAppCommand = subscribeAppCommand((command) => {
      if (command === "sidebar.toggle") toggleSidebar();
    });
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      unsubscribeAppCommand();
    };
  }, [keybindings, toggleSidebar]);

  return (
    <Tooltip>
      <TooltipTrigger render={<SidebarTrigger aria-label="Toggle main sidebar" />} />
      <TooltipPopup side="bottom">
        Toggle main sidebar{shortcutLabel ? ` (${shortcutLabel})` : ""}
      </TooltipPopup>
    </Tooltip>
  );
}

/**
 * The window's primary bar. It is the titlebar: it spans the full width above
 * the sidebar and the main pane, and its padding clears the macOS traffic
 * lights on the left and the Windows/Linux window controls on the right.
 *
 * Routes fill the context and action regions through `PrimaryBarSlot`.
 */
export function PrimaryBar() {
  // The desktop app on macOS already has the application menu in the system
  // menu bar, so a second copy in the window would be redundant.
  const showMenus = !(isElectron && isMacPlatform(navigator.platform));
  const contextSlotRef = usePrimaryBarSlotRef("context");
  const actionsSlotRef = usePrimaryBarSlotRef("actions");

  return (
    <header
      className={cn(
        "relative z-30 flex h-[var(--workspace-topbar-height)] min-h-[var(--workspace-topbar-height)] shrink-0 items-center gap-1 border-b border-border bg-background pl-[var(--workspace-controls-left)] pr-[var(--workspace-controls-right)]",
        isElectron && "drag-region",
      )}
      data-primary-bar=""
      data-workspace-titlebar-controls
    >
      <SidebarToggle />
      <PrimaryBarBrand />
      {showMenus ? <AppMenuBar /> : null}
      <div className="flex min-w-0 flex-1 items-center" ref={contextSlotRef} />
      <PrimaryBarDestinations />
      <div className="flex shrink-0 items-center gap-1" ref={actionsSlotRef} />
    </header>
  );
}
