import { createFileRoute, redirect } from "@tanstack/react-router";

import {
  normalizeSettingsPlanePath,
  openSettingsFromTarget,
  readLastWorkspaceHref,
} from "../components/settings/settingsPresentationStore";
import {
  retainSettingsScope,
  validateSettingsRouteSearch,
} from "../components/settings/settingsScopeNavigation";

/**
 * `/settings/*` is an entry bridge into the in-plane settings surface. The
 * thread (or last workspace href) stays mounted underneath so closing settings
 * restores it without a second navigation.
 */
export const Route = createFileRoute("/settings")({
  validateSearch: validateSettingsRouteSearch,
  search: { middlewares: [retainSettingsScope] },
  beforeLoad: async ({ context, location }) => {
    if (
      context.authGateState.status !== "authenticated" &&
      context.authGateState.status !== "hosted-static"
    ) {
      throw redirect({ to: "/pair", replace: true });
    }

    const returnHref = readLastWorkspaceHref() ?? "/";
    const returnPathname = returnHref.split(/[?#]/)[0] || "/";
    openSettingsFromTarget(normalizeSettingsPlanePath(location.pathname), {
      hash: location.hash.replace(/^#/, ""),
      search: location.search as Record<string, unknown>,
      openedAtPathname: returnPathname,
    });

    throw redirect({ href: returnHref, replace: true });
  },
  // Child section routes remain for deep-link matching; the plane hosts the UI.
  component: () => null,
});
