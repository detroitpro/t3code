import { EnvironmentId, ThreadId } from "@t3tools/contracts";
import { describe, expect, it } from "vite-plus/test";

import {
  createForeignTerminalHostBinding,
  foreignTerminalHostThreadId,
  isForeignTerminalHostBinding,
  normalizeHostBindingsByTerminalId,
  resolveForeignTerminalCwd,
  resolveTerminalSessionTarget,
} from "./terminalHostBinding";

const ENV_REMOTE = EnvironmentId.make("env-remote");
const ENV_LOCAL = EnvironmentId.make("env-local");
const THREAD = ThreadId.make("thread-1");

describe("foreignTerminalHostThreadId", () => {
  it("builds a stable opaque host thread key", () => {
    expect(foreignTerminalHostThreadId(ENV_REMOTE, THREAD)).toBe(
      ThreadId.make(`foreign:${ENV_REMOTE}:${THREAD}`),
    );
  });
});

describe("resolveTerminalSessionTarget", () => {
  it("defaults to the viewing thread when unbound", () => {
    expect(
      resolveTerminalSessionTarget({
        viewingEnvironmentId: ENV_REMOTE,
        viewingThreadId: THREAD,
        binding: null,
      }),
    ).toEqual({
      environmentId: ENV_REMOTE,
      threadId: THREAD,
      cwd: null,
      worktreePath: null,
    });
  });

  it("routes to the binding host when present", () => {
    const binding = createForeignTerminalHostBinding({
      sourceEnvironmentId: ENV_REMOTE,
      sourceThreadId: THREAD,
      executionEnvironmentId: ENV_LOCAL,
      cwd: "/Users/me/proj",
      worktreePath: null,
    });
    expect(
      resolveTerminalSessionTarget({
        viewingEnvironmentId: ENV_REMOTE,
        viewingThreadId: THREAD,
        binding,
      }),
    ).toEqual({
      environmentId: ENV_LOCAL,
      threadId: binding.hostThreadId,
      cwd: "/Users/me/proj",
      worktreePath: null,
    });
  });
});

describe("resolveForeignTerminalCwd", () => {
  const projects = [
    {
      environmentId: ENV_LOCAL,
      workspaceRoot: "/Users/me/t3code",
      repositoryIdentity: { canonicalKey: "github.com/detroitpro/t3code" },
    },
    {
      environmentId: ENV_LOCAL,
      workspaceRoot: "/Users/me/other",
      repositoryIdentity: { canonicalKey: "github.com/acme/other" },
    },
    {
      environmentId: ENV_REMOTE,
      workspaceRoot: "/home/runner/t3code",
      repositoryIdentity: { canonicalKey: "github.com/detroitpro/t3code" },
    },
  ];

  it("prefers the same-repo project on the target environment", () => {
    expect(
      resolveForeignTerminalCwd({
        targetEnvironmentId: ENV_LOCAL,
        sourceCanonicalKey: "github.com/detroitpro/t3code",
        projects,
        fallbackCwd: "/Users/me",
      }),
    ).toBe("/Users/me/t3code");
  });

  it("falls back to server cwd then first project", () => {
    expect(
      resolveForeignTerminalCwd({
        targetEnvironmentId: ENV_LOCAL,
        sourceCanonicalKey: "github.com/missing/repo",
        projects,
        fallbackCwd: "/Users/me",
      }),
    ).toBe("/Users/me");

    expect(
      resolveForeignTerminalCwd({
        targetEnvironmentId: ENV_LOCAL,
        sourceCanonicalKey: null,
        projects: projects.filter((project) => project.workspaceRoot === "/Users/me/other"),
        fallbackCwd: null,
      }),
    ).toBe("/Users/me/other");
  });

  it("returns null when nothing resolves", () => {
    expect(
      resolveForeignTerminalCwd({
        targetEnvironmentId: EnvironmentId.make("env-empty"),
        sourceCanonicalKey: null,
        projects,
        fallbackCwd: null,
      }),
    ).toBeNull();
  });
});

describe("isForeignTerminalHostBinding", () => {
  it("is true only when the binding targets another environment", () => {
    const binding = createForeignTerminalHostBinding({
      sourceEnvironmentId: ENV_REMOTE,
      sourceThreadId: THREAD,
      executionEnvironmentId: ENV_LOCAL,
      cwd: "/tmp",
    });
    expect(isForeignTerminalHostBinding(ENV_REMOTE, binding)).toBe(true);
    expect(isForeignTerminalHostBinding(ENV_LOCAL, binding)).toBe(false);
    expect(isForeignTerminalHostBinding(ENV_REMOTE, null)).toBe(false);
  });
});

describe("normalizeHostBindingsByTerminalId", () => {
  it("drops bindings for terminals that are no longer present", () => {
    const binding = createForeignTerminalHostBinding({
      sourceEnvironmentId: ENV_REMOTE,
      sourceThreadId: THREAD,
      executionEnvironmentId: ENV_LOCAL,
      cwd: "/tmp",
    });
    expect(
      normalizeHostBindingsByTerminalId({ "term-1": binding, "term-2": binding }, ["term-1"]),
    ).toEqual({ "term-1": binding });
  });
});
