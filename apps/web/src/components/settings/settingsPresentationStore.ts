import { create } from "zustand";

import type { SettingsPath } from "./settingsSearch";
import type { SettingsScopeSearch } from "./settingsScope";
import { validateSettingsRouteSearch } from "./settingsScopeNavigation";

/** Section routes plus a few detail pages that live outside the main nav list. */
export type SettingsPlanePath =
  | SettingsPath
  | "/settings/diagnostics"
  | "/settings/open-source-licenses";

export type OpenSettingsInput = {
  readonly path?: SettingsPlanePath;
  readonly hash?: string;
  readonly scope?: SettingsScopeSearch;
  readonly providerInstanceId?: string;
  /**
   * Workspace location to treat as "home" for this settings session. When the
   * URL leaves this path, settings closes. Defaults to the current pathname.
   */
  readonly openedAtPathname?: string;
};

type SettingsPresentationState = {
  readonly open: boolean;
  readonly path: SettingsPlanePath;
  readonly hash: string;
  readonly scope: SettingsScopeSearch;
  readonly providerInstanceId: string | undefined;
  readonly openedAtPathname: string | null;
  openSettings: (input?: OpenSettingsInput) => void;
  closeSettings: () => void;
  setSettingsPath: (path: SettingsPlanePath, hash?: string) => void;
  setSettingsScope: (scope: SettingsScopeSearch) => void;
  setProviderInstanceId: (instanceId: string | undefined) => void;
};

const LAST_WORKSPACE_HREF_KEY = "t3.settings.lastWorkspaceHref";

const DEFAULT_PATH: SettingsPlanePath = "/settings/general";

export function isSettingsPlanePath(pathname: string): pathname is SettingsPlanePath {
  return (
    pathname === "/settings/diagnostics" ||
    pathname === "/settings/open-source-licenses" ||
    pathname === "/settings/projects" ||
    pathname === "/settings/general" ||
    pathname === "/settings/appearance" ||
    pathname === "/settings/keybindings" ||
    pathname === "/settings/snap-shot" ||
    pathname === "/settings/providers" ||
    pathname === "/settings/integrations" ||
    pathname === "/settings/source-control" ||
    pathname === "/settings/storage" ||
    pathname === "/settings/connections" ||
    pathname === "/settings/archived"
  );
}

export function normalizeSettingsPlanePath(pathname: string): SettingsPlanePath {
  if (pathname === "/settings" || pathname === "/settings/") return DEFAULT_PATH;
  if (isSettingsPlanePath(pathname)) return pathname;
  return DEFAULT_PATH;
}

export function readLastWorkspaceHref(): string | null {
  try {
    const value = sessionStorage.getItem(LAST_WORKSPACE_HREF_KEY);
    return value && value.length > 0 && !value.startsWith("/settings") ? value : null;
  } catch {
    return null;
  }
}

export function writeLastWorkspaceHref(href: string): void {
  if (!href || href.startsWith("/settings")) return;
  try {
    sessionStorage.setItem(LAST_WORKSPACE_HREF_KEY, href);
  } catch {
    // Private mode / quota — opening settings still works without a return href.
  }
}

export function workspaceHrefFromLocation(location: {
  readonly pathname: string;
  readonly searchStr?: string;
  readonly hash?: string;
}): string {
  const search = location.searchStr ?? "";
  const hash = location.hash ?? "";
  return `${location.pathname}${search}${hash}`;
}

export const useSettingsPresentationStore = create<SettingsPresentationState>((set) => ({
  open: false,
  path: DEFAULT_PATH,
  hash: "",
  scope: {},
  providerInstanceId: undefined,
  openedAtPathname: null,
  openSettings: (input = {}) =>
    set((state) => ({
      open: true,
      path: input.path ?? (state.open ? state.path : DEFAULT_PATH),
      hash: input.hash ?? "",
      scope: input.scope ?? (state.open ? state.scope : {}),
      providerInstanceId:
        input.providerInstanceId ?? (state.open ? state.providerInstanceId : undefined),
      openedAtPathname:
        input.openedAtPathname ??
        state.openedAtPathname ??
        (typeof window !== "undefined" ? window.location.pathname : "/"),
    })),
  closeSettings: () =>
    set({
      open: false,
      hash: "",
      providerInstanceId: undefined,
      openedAtPathname: null,
    }),
  setSettingsPath: (path, hash = "") => set({ path, hash }),
  setSettingsScope: (scope) => set({ scope, hash: "" }),
  setProviderInstanceId: (providerInstanceId) => set({ providerInstanceId }),
}));

/** Imperative open for menus, palette, desktop actions, and route bridges. */
export function openSettings(input?: OpenSettingsInput): void {
  useSettingsPresentationStore.getState().openSettings(input);
}

export function closeSettings(): void {
  useSettingsPresentationStore.getState().closeSettings();
}

/** True when `to` is a settings section URL the plane can host. */
export function isSettingsNavigationTarget(to: string): boolean {
  return to === "/settings" || to.startsWith("/settings/");
}

/**
 * Open the in-plane settings surface for a settings URL. Used by the route
 * bridge and by call sites that previously `navigate({ to: "/settings/…" })`.
 */
export function openSettingsFromTarget(
  to: string,
  options: {
    readonly hash?: string;
    readonly search?: Record<string, unknown>;
    readonly openedAtPathname?: string;
  } = {},
): void {
  const path = normalizeSettingsPlanePath(to);
  const scope = validateSettingsRouteSearch(options.search ?? {});
  const providerInstanceId =
    typeof options.search?.instanceId === "string" && options.search.instanceId.trim()
      ? options.search.instanceId
      : undefined;
  openSettings({
    path,
    hash: options.hash?.replace(/^#/, "") ?? "",
    scope,
    ...(providerInstanceId ? { providerInstanceId } : {}),
    ...(options.openedAtPathname ? { openedAtPathname: options.openedAtPathname } : {}),
  });
}
