import { describe, expect, it } from "vite-plus/test";

import type { ResolvedKeybindingsConfig } from "@t3tools/contracts";

import { resolveMenus, type MenuContext, type ResolvedMenu } from "./menuModel";

const keybindings: ResolvedKeybindingsConfig = [
  {
    command: "sidebar.toggle",
    shortcut: {
      key: "b",
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      modKey: true,
    },
  },
];

const baseContext: MenuContext = {
  isDesktop: false,
  pullRequestsSupported: false,
  hasThread: false,
  hasProject: false,
  keybindings,
};

function itemIds(menus: ReadonlyArray<ResolvedMenu>, menuId: string): ReadonlyArray<string> {
  return menus.find((menu) => menu.id === menuId)?.items.map((entry) => entry.id) ?? [];
}

function item(menus: ReadonlyArray<ResolvedMenu>, menuId: string, itemId: string) {
  return menus.find((menu) => menu.id === menuId)?.items.find((entry) => entry.id === itemId);
}

describe("resolveMenus", () => {
  it("hides desktop-only items on the web and shows them in the desktop app", () => {
    expect(itemIds(resolveMenus(baseContext), "file")).not.toContain("quit");
    expect(itemIds(resolveMenus({ ...baseContext, isDesktop: true }), "file")).toContain("quit");
  });

  it("hides pull requests until an environment supports them", () => {
    expect(itemIds(resolveMenus(baseContext), "go")).not.toContain("pull-requests");
    expect(itemIds(resolveMenus({ ...baseContext, pullRequestsSupported: true }), "go")).toContain(
      "pull-requests",
    );
  });

  it("disables thread items until a thread is open", () => {
    expect(item(resolveMenus(baseContext), "thread", "stop")?.disabled).toBe(true);
    expect(
      item(resolveMenus({ ...baseContext, hasThread: true }), "thread", "stop")?.disabled,
    ).toBe(false);
  });

  it("takes accelerators from the user's bindings, and leaves navigation items without one", () => {
    const menus = resolveMenus(baseContext);
    expect(item(menus, "view", "sidebar")?.shortcutLabel).toBe("Ctrl+B");
    expect(item(menus, "go", "usage")?.shortcutLabel).toBeNull();
    // Rebinding the command relabels the menu item.
    const rebound = resolveMenus({
      ...baseContext,
      keybindings: [
        {
          ...keybindings[0]!,
          shortcut: { ...keybindings[0]!.shortcut, key: "k", modKey: false, altKey: true },
        },
      ],
    });
    expect(item(rebound, "view", "sidebar")?.shortcutLabel).toBe("Alt+K");
  });

  it("drops a leading separator when hidden items promote an item to the top", () => {
    const view = resolveMenus({ ...baseContext, isDesktop: true }).find(
      (menu) => menu.id === "view",
    );
    expect(view?.items[0]?.startsGroup).toBeFalsy();
  });
});
