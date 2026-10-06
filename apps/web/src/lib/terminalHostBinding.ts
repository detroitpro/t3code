import { EnvironmentId, ThreadId } from "@t3tools/contracts";

/**
 * Where a drawer tab's PTY actually runs. Absent binding means the viewing
 * thread's own environment (the historical default).
 */
export interface TerminalHostBinding {
  readonly executionEnvironmentId: EnvironmentId;
  readonly hostThreadId: ThreadId;
  readonly cwd: string;
  readonly worktreePath: string | null;
}

export interface TerminalHostBindingProject {
  readonly environmentId: EnvironmentId;
  readonly workspaceRoot: string;
  readonly repositoryIdentity?: { readonly canonicalKey: string } | null | undefined;
}

/** Stable opaque thread key for PTYs borrowed onto another environment. */
export function foreignTerminalHostThreadId(
  sourceEnvironmentId: string,
  sourceThreadId: string,
): ThreadId {
  return ThreadId.make(`foreign:${sourceEnvironmentId}:${sourceThreadId}`);
}

export function resolveTerminalSessionTarget(input: {
  readonly viewingEnvironmentId: EnvironmentId;
  readonly viewingThreadId: ThreadId;
  readonly binding: TerminalHostBinding | null | undefined;
}): {
  readonly environmentId: EnvironmentId;
  readonly threadId: ThreadId;
  readonly cwd: string | null;
  readonly worktreePath: string | null;
} {
  if (input.binding) {
    return {
      environmentId: input.binding.executionEnvironmentId,
      threadId: input.binding.hostThreadId,
      cwd: input.binding.cwd,
      worktreePath: input.binding.worktreePath,
    };
  }
  return {
    environmentId: input.viewingEnvironmentId,
    threadId: input.viewingThreadId,
    cwd: null,
    worktreePath: null,
  };
}

export function isForeignTerminalHostBinding(
  viewingEnvironmentId: EnvironmentId,
  binding: TerminalHostBinding | null | undefined,
): boolean {
  return (
    binding !== null &&
    binding !== undefined &&
    binding.executionEnvironmentId !== viewingEnvironmentId
  );
}

/**
 * Pick a cwd on the target host. Never returns the remote path — that would
 * almost always be wrong on another machine.
 */
export function resolveForeignTerminalCwd(input: {
  readonly targetEnvironmentId: EnvironmentId;
  readonly sourceCanonicalKey: string | null | undefined;
  readonly projects: ReadonlyArray<TerminalHostBindingProject>;
  readonly fallbackCwd: string | null | undefined;
}): string | null {
  const targetProjects = input.projects.filter(
    (project) => project.environmentId === input.targetEnvironmentId,
  );
  const canonicalKey = input.sourceCanonicalKey?.trim();
  if (canonicalKey) {
    const sameRepo = targetProjects.find(
      (project) => project.repositoryIdentity?.canonicalKey === canonicalKey,
    );
    if (sameRepo?.workspaceRoot.trim()) {
      return sameRepo.workspaceRoot.trim();
    }
  }

  const fallback = input.fallbackCwd?.trim();
  if (fallback) {
    return fallback;
  }

  const firstProject = targetProjects.find((project) => project.workspaceRoot.trim().length > 0);
  return firstProject?.workspaceRoot.trim() ?? null;
}

export function createForeignTerminalHostBinding(input: {
  readonly sourceEnvironmentId: EnvironmentId;
  readonly sourceThreadId: ThreadId;
  readonly executionEnvironmentId: EnvironmentId;
  readonly cwd: string;
  readonly worktreePath?: string | null;
}): TerminalHostBinding {
  return {
    executionEnvironmentId: input.executionEnvironmentId,
    hostThreadId: foreignTerminalHostThreadId(input.sourceEnvironmentId, input.sourceThreadId),
    cwd: input.cwd,
    worktreePath: input.worktreePath ?? null,
  };
}

export function normalizeHostBindingsByTerminalId(
  bindings: Record<string, TerminalHostBinding> | undefined,
  terminalIds: readonly string[],
): Record<string, TerminalHostBinding> {
  if (!bindings || Object.keys(bindings).length === 0) {
    return {};
  }
  const allowed = new Set(terminalIds);
  const next: Record<string, TerminalHostBinding> = {};
  for (const [terminalId, binding] of Object.entries(bindings)) {
    if (!allowed.has(terminalId)) continue;
    if (!binding?.executionEnvironmentId || !binding.hostThreadId || !binding.cwd) continue;
    next[terminalId] = {
      executionEnvironmentId: EnvironmentId.make(String(binding.executionEnvironmentId)),
      hostThreadId: ThreadId.make(String(binding.hostThreadId)),
      cwd: String(binding.cwd),
      worktreePath: binding.worktreePath ?? null,
    };
  }
  return next;
}
