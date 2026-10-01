---
name: merge-upstream
description: >-
  Merge the latest stable upstream release tag into detroitpro/t3code.
  Use when the user says merge upstream, sync upstream, triage upstream, pull
  upstream release, or catch up with a shipped upstream version — never tip-of-main.
disable-model-invocation: true
---

# Merge upstream

Bring the **latest stable upstream release** into `detroitpro/t3code`. Prefer
keeping local/personal changes. Never contribute anything back to the source
repo via its GitHub UI/API.

## Hard guardrails

- **No permanent `upstream` remote.** Fetch with a **one-shot URL** only
  (below). Never `git remote add upstream`, never `git push` to that URL, never
  open issues/PRs/discussions on that GitHub copy, never comment there.
- All GitHub work (`gh`, issues, PRs) targets **`detroitpro/t3code`** / `origin`.
  Pass `--repo detroitpro/t3code` on every `gh` call that needs a repo.
- Sync target is the latest **stable** tag only: `vX.Y.Z` with no suffix.
  **Refuse** tip-of-main, `*-nightly.*`, `*-preview.*`, `*-rc*`, and drafts
  unless the user explicitly overrides for this run.
- Do **not** merge tip-of-main or run `make sync` (that target is disabled).
  Merging the stable tag is the default.
- Default **keep local intent** on conflicts. Drop or skip the upstream hunk
  when it fights a deliberate personal change; record the skip rather than
  inventing a blend.

## Scope posture

This repo’s own commits are almost all **web UI**. That does **not** mean skip
other areas: if the release changes mobile, background, connect/relay, or
anything else, **prefer take**. We simply avoid _authoring_ personal-only work
in those areas.

When triaging, flag path overlap with deliberate web-UI changes — those are
where “keep local” conflicts are most likely. Skip only when the user decides
the upstream change fights local intent (or is otherwise unwanted).

## Resolve the release

Use a one-shot fetch URL (git only — not `gh` against that host):

```bash
SOURCE_URL="$(git config --get fork.sourceUrl 2>/dev/null || true)"
SOURCE_URL="${SOURCE_URL:-https://github.com/pingdotgg/t3code.git}"
```

`fork.sourceUrl` is optional local config so the literal default stays out of
muscle memory; the fallback is the public source clone URL for tag fetch only.

1. `git fetch origin` if needed. No push to `SOURCE_URL`.
2. List stable tags from the source URL (not local-only leftovers):

   ```bash
   git ls-remote --refs --tags "$SOURCE_URL" \
     | awk '{print $2}' | sed 's|refs/tags/||' \
     | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' \
     | sort -V
   ```

   Latest line = target tag `T`. Fetch it if missing locally:

   ```bash
   git fetch "$SOURCE_URL" "refs/tags/$T:refs/tags/$T" --no-tags
   ```

3. Optional previous stable `T_prev`: the line before `T` in that sorted list
   (useful for release notes / grouping). Not required for the candidate range.
4. If `git merge-base --is-ancestor "$T" origin/main`, report **already includes
   `T`** and stop. No plan issue unless the user wants one for the record.

Do **not** resolve the target via `gh` against the source GitHub copy. Tags via
`git ls-remote` / `git fetch` are enough.

## Process

Default is **one merge of tag `T`**, not per-commit cherry-picks. Releases carry
hundreds of commits and our local work is a thin layer of web-UI changes, so the
merge is mostly clean and the real work is the conflicts.

1. **Remotes.** Confirm `origin` → `detroitpro/t3code` and that **no** permanent
   remote points at the source GitHub copy (`git remote -v`). Remove one if found.
2. **Resolve `T`** per above. Stop if already an ancestor of `origin/main`.
3. **Size it.** `git rev-list --count origin/main.."$T"` (incoming) and
   `git log --oneline --no-merges "$T"..origin/main` (our local changes — the
   intent to protect).
4. **Branch and merge.** `git switch -c chore/upstream-sync-$T origin/main`, then
   `git merge --no-ff --no-commit "$T"`.
5. **Resolve conflicts** with `resolving-merge-conflicts`, biased to keep local
   intent while porting upstream's improvements into our structure. For each
   file, `git log --oneline $(git merge-base origin/main "$T")..origin/main -- <file>`
   names the local commit whose intent you are protecting. Recurring patterns:
   - Upstream product workflows stay `workflow_dispatch`-only; keep ours.
   - Upstream restyles (className → variants, token classes) inside code we
     moved: re-apply the upstream markup in our new location.
   - Upstream additions that assume chrome we replaced (titlebar strips,
     sidebar header/utility menu, fixed sidebar toggle): drop the chrome, keep
     the behavior (shortcuts, trackers, a11y attributes) wired into ours.
6. **Find semantic conflicts.** A clean textual merge can still break: removed
   exports we use, refactored props we threaded through, deleted scripts our
   `ci-ui.yml` calls. Run `make deps`, then typecheck web, mobile, contracts,
   client-runtime, desktop, server; lint; `vp fmt`; targeted tests for the
   files our local commits touch.
   Upstream's oxlint rules tighten over time — fix our code to the new rules
   rather than disabling them.
7. **Commit** the merge (`chore: merge upstream <T>`; list conflict decisions and
   anything dropped in the body). Ask before pushing or opening a PR; when asked,
   `gh pr create --repo detroitpro/t3code` and `link_pull_request`.
8. **Land it as a merge commit.** Squash or rebase drops `T` from `main`'s
   ancestry, so the next sync replays every conflict. The repo disables merge
   commits by default: ask the user to allow them for this PR
   (`gh api -X PATCH repos/detroitpro/t3code -f allow_merge_commit=true`, then
   `gh pr merge --merge`) or to fast-forward `main` to the branch. Afterwards
   `git merge-base --is-ancestor "$T" origin/main` must succeed.

Use per-item cherry-picks and a triage plan issue only when the user wants to
leave specific upstream changes out. Then: list `origin/main.."$T"` grouped by
PR number, triage `take` / `skip` / `ask` one unit at a time, record decisions
in one issue on `detroitpro/t3code` (template below), and land each `take` as
its own PR.

Toolchain: the repo wants Node 24. On older Node, lint and vitest fail to load
`.ts` configs/plugins; `NODE_OPTIONS=--experimental-strip-types` works around it.

## Plan issue template (cherry-pick mode only)

```markdown
## Upstream sync plan

- **Target release:** `<tag>` (`<sha>`)
- **Previous stable:** `<tag or n/a>`
- **origin/main:** `<sha>`
- **Fetched:** <date>

### Posture

- Stable release only — not tip-of-main / nightly / preview.
- Prefer take for all areas (including mobile, background, connect).
- Keep deliberate local (mostly web UI) changes on conflict; never push or open
  GitHub work on the source copy; never keep a permanent upstream remote.

### Candidates

- [ ] `take` `#NNNN` `<sha>…` — <one-line summary>
- [ ] `skip` `#NNNN` `<sha>…` — <one-line summary> — **reason:** <why>
- [ ] `defer` `#NNNN` `<sha>…` — <one-line summary>

### Done

- [x] `#NNNN` / `<sha>` — <PR url>

### Skipped (decided)

- `#NNNN` / `<sha>` — <reason>
```

## Done when

- `origin/main` already contains `T`, or a merge branch for `T` typechecks, lints,
  and passes targeted tests with every conflict decision recorded in the commit, and
- No permanent upstream remote exists, no GitHub API was used against the source
  copy, and tip-of-main / nightly / preview were not merged unless explicitly
  overridden.
