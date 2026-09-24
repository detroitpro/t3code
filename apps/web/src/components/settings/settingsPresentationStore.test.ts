import { afterEach, describe, expect, it } from "vite-plus/test";

import {
  closeSettings,
  isSettingsNavigationTarget,
  isWorkspaceReturnPath,
  normalizeSettingsPlanePath,
  openSettings,
  openSettingsFromTarget,
  readLastWorkspaceHref,
  rememberRouterPathname,
  useSettingsPresentationStore,
  writeLastWorkspaceHref,
} from "./settingsPresentationStore";

afterEach(() => {
  closeSettings();
  try {
    sessionStorage.removeItem("t3.settings.lastWorkspaceHref");
  } catch {
    // ignore
  }
});

describe("settingsPresentationStore", () => {
  it("opens on general by default and closes cleanly", () => {
    openSettings({ openedAtPathname: "/env/thread" });
    const state = useSettingsPresentationStore.getState();
    expect(state.open).toBe(true);
    expect(state.path).toBe("/settings/general");
    expect(state.openedAtPathname).toBe("/env/thread");

    closeSettings();
    expect(useSettingsPresentationStore.getState().open).toBe(false);
    expect(useSettingsPresentationStore.getState().openedAtPathname).toBeNull();
  });

  it("maps legacy provider environmentId search onto the machine scope", () => {
    openSettingsFromTarget("/settings/providers", {
      search: { environmentId: "env_1", instanceId: "inst_1" },
      openedAtPathname: "/",
    });
    const state = useSettingsPresentationStore.getState();
    expect(state.path).toBe("/settings/providers");
    expect(state.scope.machine).toBe("env_1");
    expect(state.providerInstanceId).toBe("inst_1");
  });

  it("normalizes bare /settings and recognizes settings targets", () => {
    expect(normalizeSettingsPlanePath("/settings")).toBe("/settings/general");
    expect(isSettingsNavigationTarget("/settings/keybindings")).toBe(true);
    expect(isSettingsNavigationTarget("/usage")).toBe(false);
  });

  it("defaults openedAtPathname to the remembered router path, not the shell path", () => {
    // Electron hash history keeps window.location.pathname at "/" while the
    // app route lives in the hash; the store must latch the router path.
    rememberRouterPathname("/env_abc/thread_xyz");
    openSettings();
    expect(useSettingsPresentationStore.getState().openedAtPathname).toBe("/env_abc/thread_xyz");
  });

  it("does not remember /projects or /settings stubs as the workspace return path", () => {
    rememberRouterPathname("/env_abc/thread_xyz");
    rememberRouterPathname("/projects/t3code");
    rememberRouterPathname("/settings/projects");
    openSettings();
    expect(useSettingsPresentationStore.getState().openedAtPathname).toBe("/env_abc/thread_xyz");

    expect(isWorkspaceReturnPath("/env_abc/thread_xyz")).toBe(true);
    expect(isWorkspaceReturnPath("/projects/t3code")).toBe(false);
    expect(isWorkspaceReturnPath("/settings/general")).toBe(false);

    const memory = new Map<string, string>();
    const previous = globalThis.sessionStorage;
    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => memory.get(key) ?? null,
        setItem: (key: string, value: string) => {
          memory.set(key, value);
        },
        removeItem: (key: string) => {
          memory.delete(key);
        },
      },
    });
    try {
      writeLastWorkspaceHref("/env_abc/thread_xyz?foo=1");
      writeLastWorkspaceHref("/projects/t3code");
      writeLastWorkspaceHref("/settings/projects?project=t3code");
      expect(readLastWorkspaceHref()).toBe("/env_abc/thread_xyz?foo=1");
    } finally {
      Object.defineProperty(globalThis, "sessionStorage", {
        configurable: true,
        value: previous,
      });
    }
  });

  it("opens project settings in-plane with the project scope", () => {
    openSettingsFromTarget("/settings/projects", {
      search: { project: "t3code" },
      openedAtPathname: "/env/thread",
    });
    const state = useSettingsPresentationStore.getState();
    expect(state.open).toBe(true);
    expect(state.path).toBe("/settings/projects");
    expect(state.scope.project).toBe("t3code");
    expect(state.openedAtPathname).toBe("/env/thread");
  });
});
