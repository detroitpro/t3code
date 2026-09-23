import { afterEach, describe, expect, it } from "vite-plus/test";

import {
  closeSettings,
  isSettingsNavigationTarget,
  normalizeSettingsPlanePath,
  openSettings,
  openSettingsFromTarget,
  rememberRouterPathname,
  useSettingsPresentationStore,
} from "./settingsPresentationStore";

afterEach(() => {
  closeSettings();
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
});
