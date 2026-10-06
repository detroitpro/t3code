import type { EnvironmentId, ScopedThreadRef, ThreadId } from "@t3tools/contracts";
import { useCallback, useMemo } from "react";

import {
  createForeignTerminalHostBinding,
  resolveForeignTerminalCwd,
  type TerminalHostBinding,
} from "~/lib/terminalHostBinding";
import { useProjects, useServerConfigs } from "~/state/entities";
import { useEnvironment, usePrimaryEnvironmentId } from "~/state/environments";

export function useBorrowedTerminalHost(input: {
  readonly threadRef: ScopedThreadRef;
  readonly threadId: ThreadId;
  readonly sourceCanonicalKey: string | null | undefined;
}): {
  readonly canOpenOnThisMachine: boolean;
  readonly thisMachineLabel: string | undefined;
  readonly primaryEnvironmentId: EnvironmentId | null;
  readonly hostLabelsByEnvironmentId: ReadonlyMap<EnvironmentId, string>;
  readonly resolveThisMachineBinding: () => TerminalHostBinding | null;
} {
  const primaryEnvironmentId = usePrimaryEnvironmentId();
  const primaryEnvironment = useEnvironment(primaryEnvironmentId);
  const projects = useProjects();
  const serverConfigs = useServerConfigs();
  const viewingEnvironmentId = input.threadRef.environmentId;
  const sourceCanonicalKey = input.sourceCanonicalKey;
  const sourceThreadId = input.threadId;

  const canOpenOnThisMachine =
    primaryEnvironmentId !== null &&
    primaryEnvironmentId !== viewingEnvironmentId &&
    primaryEnvironment !== null;

  const thisMachineLabel = canOpenOnThisMachine
    ? primaryEnvironment?.label.trim() || "This machine"
    : undefined;

  const hostLabelsByEnvironmentId = useMemo(() => {
    const next = new Map<EnvironmentId, string>();
    if (primaryEnvironmentId && thisMachineLabel) {
      next.set(primaryEnvironmentId, thisMachineLabel);
    }
    return next;
  }, [primaryEnvironmentId, thisMachineLabel]);

  const resolveThisMachineBinding = useCallback((): TerminalHostBinding | null => {
    if (!primaryEnvironmentId || primaryEnvironmentId === viewingEnvironmentId) {
      return null;
    }
    const cwd = resolveForeignTerminalCwd({
      targetEnvironmentId: primaryEnvironmentId,
      sourceCanonicalKey,
      projects,
      fallbackCwd: serverConfigs.get(primaryEnvironmentId)?.cwd ?? null,
    });
    if (!cwd) {
      return null;
    }
    return createForeignTerminalHostBinding({
      sourceEnvironmentId: viewingEnvironmentId,
      sourceThreadId,
      executionEnvironmentId: primaryEnvironmentId,
      cwd,
      worktreePath: null,
    });
  }, [
    primaryEnvironmentId,
    projects,
    serverConfigs,
    sourceCanonicalKey,
    sourceThreadId,
    viewingEnvironmentId,
  ]);

  return {
    canOpenOnThisMachine,
    thisMachineLabel,
    primaryEnvironmentId,
    hostLabelsByEnvironmentId,
    resolveThisMachineBinding,
  };
}
