# Fork-only notes (`detroitpro/t3code`)

This fork tracks personal work that is **not** proposed elsewhere. Never open
PRs, issues, or discussions against any other GitHub copy of T3 Code. GitHub
work happens only on [`detroitpro/t3code`](https://github.com/detroitpro/t3code).

Keep useful upstream **stable releases** via the **`merge-upstream`** skill
(latest `vX.Y.Z` tag only → triage → one GitHub plan issue on this fork →
cherry-pick one by one). Fetch tags from the `upstream` **git** remote — never
push to it, and never use that remote’s GitHub issues, PRs, or discussions.
Do not sync tip-of-`upstream/main`, nightlies, or previews unless you mean to.

Blunt full merge of tip-of-main (usually wrong for this fork):

```bash
make sync                 # fetch + merge upstream/main into the current branch
git push origin HEAD      # push to this fork only
```

If `upstream` is missing, add it once with `git remote add upstream <fork-source-url>`
(the URL already configured on this machine’s remote is fine; agents must not link
or operate on that GitHub repo beyond git sync when asked).

## Primary human CLI: `make`

Agents: same CLI — prefer `make` over bare `vp`. Rule: `.cursor/rules/local-vp.mdc`. Skill: `local-vp`.

```bash
make              # colorized menu
make i            # install this checkout as local AppImage
make deps         # pnpm install → repo-local node_modules/.bin/vp (then vp i)
make dev          # web + server (alias: make d)
make share        # dev --share
make desktop      # Electron + server
make fmt lint tc  # format / lint / typecheck
make test ARGS=apps/web/src/rightPanelStore.test.ts
make dist         # AppImage only → release/
make sync         # blunt tip-of-main merge (prefer merge-upstream skill / stable)
make bootstrap    # check Node / repo-local vp / apt (alias: make b, make doctor)
make pair         # mint pairing token
make clean
```

Vite+ (`vp`) is **repo-local only**. `make` prepends `node_modules/.bin` and
never requires a global `vp`. Do not run `curl https://vite.plus | bash` —
global Vite+ shims yarn/npm and breaks other projects.

## Workstation bootstrap

```bash
make bootstrap
./scripts/dev-bootstrap-local.sh --fix   # sudo apt-install missing build deps
make deps                                 # installs pnpm deps + local vp
make dev                                  # use the printed pairing URL
```

Worktree state lives in this checkout's `.t3/`. Do not point a dev server at
live `~/.t3/userdata`.

## Local AppImage (dock / app menu)

Preferred:

```bash
make i
```

Same underlying script (with extra flags if needed):

```bash
make deps   # if node_modules/.bin/vp is missing
./scripts/install-local-appimage.sh
./scripts/install-local-appimage.sh --skip-build
./scripts/install-local-appimage.sh --replace-stock   # also rewrites t3-code.desktop
```

Defaults:

- `~/Applications/T3-Code-local.AppImage`
- `~/.local/share/applications/t3-code-local.desktop` → “T3 Code (Local)”

Related: [#2](https://github.com/detroitpro/t3code/issues/2).
