import { EnvironmentId, ProviderInstanceId } from "@t3tools/contracts";
import { RotateCcwIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { Button } from "../ui/button";
import { WorkspacePageHeader } from "../WorkspacePageHeader";
import { ConnectionsSettings } from "./ConnectionsSettings";
import { DiagnosticsSettingsPanel } from "./DiagnosticsSettings";
import { IntegrationsSettingsPanel } from "./IntegrationsSettings";
import { KeybindingsSettingsPanel } from "./KeybindingsSettings";
import { OpenSourceLicensesPanel } from "./OpenSourceLicenses";
import { ProjectsSettings } from "./ProjectsSettings";
import { ProviderSettingsPanel } from "./ProviderSettingsPanel";
import { SettingsBreadcrumb } from "./SettingsBreadcrumb";
import {
  AppearanceSettingsPanel,
  ArchivedThreadsPanel,
  GeneralSettingsPanel,
  useSettingsRestore,
} from "./SettingsPanels";
import { SettingsScopeNotice } from "./SettingsScopeNotice";
import { SettingsScopeProvider, useSettingsScope } from "./SettingsScopeContext";
import { SettingsSidebarNav } from "./SettingsSidebarNav";
import { SnapShotSettings } from "./SnapShotSettings";
import { SourceControlSettingsPanel } from "./SourceControlSettings";
import { StorageSettingsPanel } from "./StorageSettings";
import {
  closeSettings,
  type SettingsPlanePath,
  useSettingsPresentationStore,
} from "./settingsPresentationStore";
import {
  getSettingsSearchTargetScope,
  getThreadAutoSettlementSearchAvailability,
  isSettingsSearchScopeAvailable,
} from "./settingsSearch";
import { useSettingsProjectGroups } from "./useSettingsProjectGroups";
import { useEnvironments } from "../../state/environments";

const DEVICE_ONLY_PATHS = new Set<SettingsPlanePath>([
  "/settings/appearance",
  "/settings/snap-shot",
  "/settings/connections",
]);

function RestoreDeviceDefaultsButton({ onRestored }: { onRestored: () => void }) {
  const { changedSettingLabels, restoreDefaults } = useSettingsRestore(onRestored);
  return (
    <Button
      size="xs"
      variant="ghost"
      disabled={changedSettingLabels.length === 0}
      onClick={() => void restoreDefaults()}
    >
      <RotateCcwIcon className="mx-1 size-3.5" />
      Restore device defaults
    </Button>
  );
}

function SettingsScopeBoundary({ pathname, children }: { pathname: string; children: ReactNode }) {
  const { scope, connectedEnvironments } = useSettingsScope();
  const { environments } = useEnvironments();
  const hash = useSettingsPresentationStore((state) => state.hash);
  const hashTarget = hash ? `#${hash}` : "";
  const searchTarget = getSettingsSearchTargetScope(hashTarget);
  const autoSettlementAvailability = searchTarget?.requiresThreadAutoSettlement
    ? getThreadAutoSettlementSearchAvailability(environments, scope)
    : null;
  if (
    scope.kind !== "unavailable" &&
    searchTarget &&
    autoSettlementAvailability &&
    !autoSettlementAvailability.isTargetAvailable
  ) {
    return (
      <SettingsScopeNotice
        target="environment"
        targetId={hashTarget}
        eligibleEnvironmentIds={autoSettlementAvailability.eligibleEnvironmentIds}
      >
        {autoSettlementAvailability.eligibleEnvironmentIds.length > 0
          ? `${searchTarget.title} requires a supporting environment. Choose one to continue.`
          : `${searchTarget.title} requires a supporting environment. Connect or update an environment to continue.`}
      </SettingsScopeNotice>
    );
  }
  if (
    scope.kind !== "unavailable" &&
    searchTarget &&
    !isSettingsSearchScopeAvailable(searchTarget.scope, scope.kind)
  ) {
    const target =
      searchTarget.scope === "environment" ||
      searchTarget.scope === "project" ||
      searchTarget.scope === "checkout"
        ? searchTarget.scope
        : "all";
    return (
      <SettingsScopeNotice target={target} targetId={hashTarget}>
        {`${searchTarget.title} is not available for the selected target. Choose its owning scope to continue.`}
      </SettingsScopeNotice>
    );
  }
  if (DEVICE_ONLY_PATHS.has(pathname as SettingsPlanePath) || pathname === "/settings/projects") {
    return children;
  }
  if (scope.kind === "unavailable") {
    return <p className="p-8 text-sm text-muted-foreground">{scope.message}</p>;
  }
  if (scope.kind === "environment" && connectedEnvironments.length === 0) {
    return (
      <p className="p-8 text-sm text-muted-foreground">
        Reconnect {scope.label} to change its settings.
      </p>
    );
  }
  return children;
}

function SettingsProvidersPane() {
  const { environment, scope } = useSettingsScope();
  const providerInstanceId = useSettingsPresentationStore((state) => state.providerInstanceId);
  if (!environment) {
    return (
      <p className="p-8 text-sm text-muted-foreground">
        {scope.kind === "environment"
          ? `Reconnect ${scope.label} to set up its providers.`
          : "Connect an environment to set up its providers."}
      </p>
    );
  }
  return (
    <ProviderSettingsPanel
      environmentId={EnvironmentId.make(environment.environmentId)}
      {...(providerInstanceId ? { instanceId: ProviderInstanceId.make(providerInstanceId) } : {})}
      scoped
    />
  );
}

function SettingsPlanePanel({ path }: { path: SettingsPlanePath }) {
  switch (path) {
    case "/settings/general":
      return <GeneralSettingsPanel />;
    case "/settings/appearance":
      return <AppearanceSettingsPanel />;
    case "/settings/projects":
      return <ProjectsSettings />;
    case "/settings/keybindings":
      return <KeybindingsSettingsPanel />;
    case "/settings/snap-shot":
      return <SnapShotSettings />;
    case "/settings/providers":
      return <SettingsProvidersPane />;
    case "/settings/integrations":
      return <IntegrationsSettingsPanel />;
    case "/settings/source-control":
      return <SourceControlSettingsPanel />;
    case "/settings/storage":
      return <StorageSettingsPanel />;
    case "/settings/connections":
      return <ConnectionsSettings />;
    case "/settings/archived":
      return <ArchivedThreadsPanel />;
    case "/settings/diagnostics":
      return <DiagnosticsSettingsPanel />;
    case "/settings/open-source-licenses":
      return <OpenSourceLicensesPanel />;
  }
}

/**
 * Settings master/detail hosted in the main editor plane. The thread list stays
 * in the app sidebar; Esc / Close returns to whatever workspace route is still
 * mounted underneath.
 */
export function SettingsEditorPlane() {
  const path = useSettingsPresentationStore((state) => state.path);
  const hash = useSettingsPresentationStore((state) => state.hash);
  const scope = useSettingsPresentationStore((state) => state.scope);
  const setSettingsPath = useSettingsPresentationStore((state) => state.setSettingsPath);
  const setSettingsScope = useSettingsPresentationStore((state) => state.setSettingsScope);
  const groups = useSettingsProjectGroups();
  const { environments } = useEnvironments();
  const [restoreSignal, setRestoreSignal] = useState(0);
  const showScope = !DEVICE_ONLY_PATHS.has(path);

  const handleClose = useCallback(() => {
    closeSettings();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key !== "Escape") return;
      event.preventDefault();
      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLElement) {
        activeElement.blur();
      }
      handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  const locationLikePathname = path;
  const scopeValue = useMemo(() => scope, [scope]);

  return (
    <SettingsScopeProvider search={scopeValue} onChange={setSettingsScope}>
      <div
        className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background text-foreground"
        data-settings-editor-plane=""
      >
        <WorkspacePageHeader>
          <div className="flex w-full min-w-0 items-center gap-3">
            <SettingsBreadcrumb
              pathname={locationLikePathname}
              scope={
                showScope
                  ? { value: scopeValue, groups, environments, onChange: setSettingsScope }
                  : undefined
              }
            />
            {path === "/settings/general" ? (
              <div className="flex shrink-0 items-center">
                <RestoreDeviceDefaultsButton
                  onRestored={() => setRestoreSignal((value) => value + 1)}
                />
              </div>
            ) : null}
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label="Close settings"
              className="ms-auto shrink-0"
              onClick={handleClose}
            >
              <XIcon className="size-3.5" />
            </Button>
          </div>
        </WorkspacePageHeader>

        <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
          <aside className="flex w-[min(100%,16.5rem)] shrink-0 flex-col border-e border-border bg-sidebar text-sidebar-foreground">
            <SettingsSidebarNav
              pathname={path}
              hash={hash ? `#${hash}` : ""}
              variant="plane"
              onNavigateSection={(to, nextHash) => {
                setSettingsPath(to, nextHash?.replace(/^#/, "") ?? "");
              }}
            />
          </aside>

          <div
            key={`${path}:${JSON.stringify(scopeValue)}:${restoreSignal}:${hash}`}
            className="flex min-h-0 min-w-0 flex-1 flex-col"
          >
            <SettingsScopeBoundary pathname={path}>
              <SettingsPlanePanel path={path} />
            </SettingsScopeBoundary>
          </div>
        </div>
      </div>
    </SettingsScopeProvider>
  );
}
