import type { KeybindingCommand, ResolvedKeybindingsConfig } from "@t3tools/contracts";

import { shortcutLabelForCommand } from "../../keybindings";
import type { DesktopAppCommand } from "./desktopAppCommands";

/** What choosing a menu item does. */
export type MenuAction =
  /** Hand the command to whichever component owns its keybinding handler. */
  | { readonly kind: "command"; readonly command: KeybindingCommand }
  /** Navigate the app. */
  | { readonly kind: "navigate"; readonly to: string }
  /** Open the command palette, optionally on one of its flows. */
  | { readonly kind: "palette"; readonly open?: "add-project" | "new-thread-in" }
  /** Run a command only the desktop shell can (zoom, reload, quit). */
  | { readonly kind: "desktop"; readonly command: DesktopAppCommand }
  /** Open a documentation or licence page. */
  | { readonly kind: "link"; readonly href: string };

export interface MenuItemDescriptor {
  readonly id: string;
  readonly label: string;
  readonly action: MenuAction;
  /** Rendered as a separator above this item. */
  readonly startsGroup?: boolean;
  /** Item is hidden unless running in the desktop app. */
  readonly desktopOnly?: boolean;
  /** Item is hidden unless some environment reports pull request support. */
  readonly requiresPullRequests?: boolean;
  /** Item is disabled unless a thread is open. */
  readonly requiresThread?: boolean;
  /** Item is disabled unless the open thread belongs to a project. */
  readonly requiresProject?: boolean;
}

export interface MenuDescriptor {
  readonly id: string;
  readonly label: string;
  readonly items: ReadonlyArray<MenuItemDescriptor>;
}

export interface MenuContext {
  readonly isDesktop: boolean;
  readonly pullRequestsSupported: boolean;
  readonly hasThread: boolean;
  readonly hasProject: boolean;
  readonly keybindings: ResolvedKeybindingsConfig;
}

export interface ResolvedMenuItem extends MenuItemDescriptor {
  readonly disabled: boolean;
  /** The user's current shortcut for the item, when it has one. */
  readonly shortcutLabel: string | null;
}

export interface ResolvedMenu {
  readonly id: string;
  readonly label: string;
  readonly items: ReadonlyArray<ResolvedMenuItem>;
}

/**
 * The menus, in bar order. Items name an existing command wherever one exists
 * so the menu, the command palette and the keybinding stay one behavior.
 */
export const APP_MENUS: ReadonlyArray<MenuDescriptor> = [
  {
    id: "file",
    label: "File",
    items: [
      { id: "new-thread", label: "New Thread", action: { kind: "command", command: "chat.new" } },
      {
        id: "new-local-thread",
        label: "New Local Thread",
        action: { kind: "command", command: "chat.newLocal" },
      },
      {
        id: "add-project",
        label: "Add Project…",
        startsGroup: true,
        action: { kind: "palette", open: "add-project" },
      },
      {
        id: "settings",
        label: "Settings",
        startsGroup: true,
        action: { kind: "navigate", to: "/settings" },
      },
      {
        id: "close-window",
        label: "Close Window",
        startsGroup: true,
        desktopOnly: true,
        action: { kind: "desktop", command: "close-window" },
      },
      {
        id: "quit",
        label: "Quit T3 Code",
        desktopOnly: true,
        action: { kind: "desktop", command: "quit" },
      },
    ],
  },
  {
    id: "view",
    label: "View",
    items: [
      {
        id: "command-palette",
        label: "Command Palette…",
        action: { kind: "palette" },
      },
      {
        id: "sidebar",
        label: "Sidebar",
        startsGroup: true,
        action: { kind: "command", command: "sidebar.toggle" },
      },
      {
        id: "terminal",
        label: "Terminal",
        requiresThread: true,
        requiresProject: true,
        action: { kind: "command", command: "terminal.toggle" },
      },
      {
        id: "right-panel",
        label: "Right Panel",
        requiresThread: true,
        action: { kind: "command", command: "rightPanel.toggle" },
      },
      {
        id: "maximize-panel",
        label: "Maximize Panel",
        requiresThread: true,
        action: { kind: "command", command: "rightPanel.toggleMaximized" },
      },
      {
        id: "diff",
        label: "Diff",
        requiresThread: true,
        action: { kind: "command", command: "diff.toggle" },
      },
      {
        id: "preview",
        label: "Preview",
        requiresThread: true,
        action: { kind: "command", command: "preview.toggle" },
      },
      {
        id: "theme",
        label: "Theme…",
        startsGroup: true,
        action: { kind: "command", command: "theme.select" },
      },
      {
        id: "appearance",
        label: "Cycle Appearance",
        action: { kind: "command", command: "appearance.cycle" },
      },
      {
        id: "zoom-in",
        label: "Zoom In",
        startsGroup: true,
        desktopOnly: true,
        action: { kind: "desktop", command: "zoom-in" },
      },
      {
        id: "zoom-out",
        label: "Zoom Out",
        desktopOnly: true,
        action: { kind: "desktop", command: "zoom-out" },
      },
      {
        id: "zoom-reset",
        label: "Actual Size",
        desktopOnly: true,
        action: { kind: "desktop", command: "zoom-reset" },
      },
      {
        id: "fullscreen",
        label: "Toggle Full Screen",
        desktopOnly: true,
        action: { kind: "desktop", command: "toggle-fullscreen" },
      },
      {
        id: "reload",
        label: "Reload",
        startsGroup: true,
        desktopOnly: true,
        action: { kind: "desktop", command: "reload" },
      },
      {
        id: "dev-tools",
        label: "Toggle Developer Tools",
        desktopOnly: true,
        action: { kind: "desktop", command: "toggle-dev-tools" },
      },
    ],
  },
  {
    id: "thread",
    label: "Thread",
    items: [
      {
        id: "stop",
        label: "Stop",
        requiresThread: true,
        action: { kind: "command", command: "thread.stop" },
      },
      {
        id: "copy-reference",
        label: "Copy Reference",
        startsGroup: true,
        requiresThread: true,
        action: { kind: "command", command: "thread.copyReference" },
      },
      {
        id: "pin",
        label: "Pin",
        requiresThread: true,
        action: { kind: "command", command: "thread.pin" },
      },
      {
        id: "settle",
        label: "Settle",
        requiresThread: true,
        action: { kind: "command", command: "thread.settle" },
      },
      {
        id: "open-in-editor",
        label: "Open in Editor",
        startsGroup: true,
        requiresThread: true,
        requiresProject: true,
        action: { kind: "command", command: "editor.openFavorite" },
      },
    ],
  },
  {
    id: "go",
    label: "Go",
    items: [
      {
        id: "go-to-file",
        label: "Go to File…",
        requiresThread: true,
        requiresProject: true,
        action: { kind: "command", command: "filePicker.toggle" },
      },
      {
        id: "search-project",
        label: "Search Project…",
        requiresThread: true,
        requiresProject: true,
        action: { kind: "command", command: "projectSearch.toggle" },
      },
      {
        id: "previous-thread",
        label: "Previous Thread",
        startsGroup: true,
        action: { kind: "command", command: "thread.previous" },
      },
      {
        id: "next-thread",
        label: "Next Thread",
        action: { kind: "command", command: "thread.next" },
      },
      {
        id: "usage",
        label: "Usage",
        startsGroup: true,
        action: { kind: "navigate", to: "/usage" },
      },
      {
        id: "pull-requests",
        label: "Pull Requests",
        requiresPullRequests: true,
        action: { kind: "navigate", to: "/pull-requests" },
      },
    ],
  },
  {
    id: "help",
    label: "Help",
    items: [
      {
        id: "keyboard-shortcuts",
        label: "Keyboard Shortcuts",
        action: { kind: "navigate", to: "/settings/keybindings" },
      },
      {
        id: "open-source-licenses",
        label: "Open Source Licenses",
        action: { kind: "navigate", to: "/settings/open-source-licenses" },
      },
      {
        id: "check-for-updates",
        label: "Check for Updates…",
        startsGroup: true,
        desktopOnly: true,
        action: { kind: "desktop", command: "check-for-updates" },
      },
    ],
  },
];

function isItemVisible(item: MenuItemDescriptor, context: MenuContext): boolean {
  if (item.desktopOnly && !context.isDesktop) return false;
  if (item.requiresPullRequests && !context.pullRequestsSupported) return false;
  return true;
}

function isItemDisabled(item: MenuItemDescriptor, context: MenuContext): boolean {
  if (item.requiresThread && !context.hasThread) return true;
  if (item.requiresProject && !context.hasProject) return true;
  return false;
}

/**
 * Applies the current context to the descriptors: drops items this build or
 * environment cannot offer, disables the ones that need a thread or project,
 * and labels each with the shortcut the user has bound to it.
 */
export function resolveMenus(
  context: MenuContext,
  menus: ReadonlyArray<MenuDescriptor> = APP_MENUS,
): ReadonlyArray<ResolvedMenu> {
  return menus
    .map((menu) => {
      const visibleItems = menu.items.filter((item) => isItemVisible(item, context));
      // A separator is a property of the item below it, so an item promoted to
      // the top of a menu by hidden neighbours must not keep its leading rule.
      const items = visibleItems.map((item, index) => ({
        ...item,
        ...(index === 0 ? { startsGroup: false } : {}),
        disabled: isItemDisabled(item, context),
        shortcutLabel:
          item.action.kind === "command"
            ? shortcutLabelForCommand(context.keybindings, item.action.command)
            : null,
      }));
      return { id: menu.id, label: menu.label, items };
    })
    .filter((menu) => menu.items.length > 0);
}
