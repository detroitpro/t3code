---
name: merge-upstream
description: >-
  Selectively merge the latest stable upstream release into this fork. Use when
  the user says merge upstream, sync upstream, triage upstream, pull upstream
  release, or catch up with a shipped upstream version — never tip-of-main.
disable-model-invocation: true
---

# Merge upstream

Bring commits from the **latest stable upstream release** into `detroitpro/t3code`,
triaged one by one. Prefer keeping fork changes. Never contribute anything back
to upstream.

## Hard guardrails

- **Fetch only** from the `upstream` git remote. Never `git push upstream`, never
  open issues/PRs/discussions on `pingdotgg/t3code`, never comment there.
- All GitHub work (`gh`, issues, PRs) targets **`detroitpro/t3code`** / `origin`.
- Sync target is the latest **stable** tag only: `vX.Y.Z` with no suffix.
  **Refuse** `upstream/main`, `*-nightly.*`, `*-preview.*`, `*-rc*`, and drafts
  unless the user explicitly overrides for this run.
- Do **not** run a blind `git merge upstream/main` or `make sync` in this skill.
- Default **keep the fork** on conflicts. Drop or skip the upstream hunk when it
  fights a deliberate fork change; record the skip rather than inventing a blend.

## Scope posture

This fork’s own commits are almost all **web UI**. That does **not** mean skip
other areas: if the release changes mobile, background, connect/relay, or
anything else, **prefer take**. We simply avoid _authoring_ fork-only work in
those areas.

When triaging, flag path overlap with deliberate fork web-UI changes — those are
where “keep the fork” conflicts are most likely. Skip only when the user decides
the upstream change fights fork intent (or is otherwise unwanted).

## Resolve the release

1. `git fetch upstream --tags` (and `git fetch origin` if needed). No push.
2. List stable tags from the upstream remote (not local-only leftovers):

   ```bash
   git ls-remote --refs --tags upstream \
     | awk '{print $2}' | sed 's|refs/tags/||' \
     | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' \
     | sort -V
   ```

   Latest line = target tag `T`. Fetch it if missing locally:
   `git fetch upstream tag "$T" --no-tags`.

3. Optional previous stable `T_prev`: the line before `T` in that sorted list
   (useful for release notes / grouping). Not required for the candidate range.
4. If `git merge-base --is-ancestor "$T" origin/main`, report **already includes
   `T`** and stop. No plan issue unless the user wants one for the record.

Do **not** resolve the target via `gh` against pingdotgg. Git tags on `upstream`
are enough.

## Process

Two phases. Finish **Plan** before any cherry-pick. In **Execute**, one checklist
item at a time — do not start the next until the current one is merged, skipped,
or the user defers.

### Phase 1 — Plan (single GitHub issue)

1. **Remotes.** Confirm `origin` → `detroitpro/t3code` and `upstream` is the
   pingdotgg git remote (fetch URL only matters). If `upstream` is missing, stop
   and ask; do not guess a URL beyond what `git remote -v` already shows.
2. **Resolve `T`** per above. Stop if already an ancestor of `origin/main`.
3. **Candidate list** — commits in the release that this fork lacks:

   ```bash
   git log --oneline --reverse origin/main.."$T"
   ```

   Group adjacent commits that share one PR number (`(#NNNN)` in the subject)
   into a single triage unit; list every SHA in the unit. Prefer oldest-first
   (cherry-pick order).

4. **Prior skips.** Search this fork’s issues
   (`gh issue list -R detroitpro/t3code --state all --search "upstream sync"`)
   and treat previously skipped SHAs/PRs as already decided unless the user
   reopens them.
5. **Triage one by one.** For each unit, show: subject / PR, paths touched,
   whether it overlaps fork web-UI changes, and a recommendation
   (`take` / `skip` / `ask`). Default is `take` unless it clearly fights known
   fork intent. Wait for the user’s call before moving on. Do not auto-accept a
   long batch.
6. **Open one plan issue** on `detroitpro/t3code` with the template below. Title
   like `chore: upstream sync <tag>`. Stop after the issue exists and the user
   picks which `take` item to execute first.

### Phase 2 — Execute (one checklist item)

For the chosen `take` item only:

1. Branch from up-to-date `origin/main`.
2. Cherry-pick the SHA(s) (or an equivalent minimal apply). No full merge of
   `upstream/main`. Merging tag `T` in one shot is only OK if the user asks for
   that instead of per-item cherry-picks.
3. On conflict: keep fork intent; use `resolving-merge-conflicts` with that bias.
   If the upstream change cannot land without wrecking deliberate fork behavior,
   **skip**, record the reason on the plan issue, and abort the branch.
4. Verify narrowly (targeted tests / typecheck for touched paths). No repo-wide
   suite unless asked.
5. Land a PR to `detroitpro/t3code` (conventional title). Link the plan issue.
   Register the PR with the thread (`link_pull_request`) when that tool exists.
6. Update the plan issue checklist (`take` → done with PR link, or → skipped).
7. Stop and ask which item is next.

## Plan issue template

```markdown
## Upstream sync plan

- **Target release:** `<tag>` (`<sha>`)
- **Previous stable:** `<tag or n/a>`
- **origin/main:** `<sha>`
- **Fetched:** <date>

### Posture

- Stable release only — not tip-of-main / nightly / preview.
- Prefer take for all areas (including mobile, background, connect).
- Keep deliberate fork (mostly web UI) changes on conflict; never push or open
  GitHub work on upstream.

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

- `origin/main` already contained `T`, or a plan issue exists for this campaign, and
- Every `take` the user wanted landed as its own PR (or was reclassified), and
- Every `skip` has a written reason on that issue, and
- Nothing was pushed to `upstream`, no GitHub API was used against pingdotgg, and
  tip-of-main / nightly / preview were not merged unless explicitly overridden.
