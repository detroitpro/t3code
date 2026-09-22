# Fork-only notes (`detroitpro/t3code`)

This fork tracks personal work that is **not** proposed elsewhere. Never open
PRs, issues, or discussions against any other GitHub copy of T3 Code. GitHub
work happens only on [`detroitpro/t3code`](https://github.com/detroitpro/t3code).

Keep `main` current with the `upstream` **git** remote (fetch/merge only — never
use that remote’s GitHub issues, PRs, or discussions):

```bash
git fetch upstream
git checkout main
git merge upstream/main   # or rebase
git push origin main
```

If `upstream` is missing, add it once with `git remote add upstream <fork-source-url>`
(the URL already configured on this machine’s remote is fine; agents must not link
or operate on that GitHub repo beyond git sync when asked).

## Primary human CLI: `make`

```bash
make              # colorized menu
make i            # install this checkout as local AppImage
make deps         # vp i
make dev          # web + server (alias: make d)
make share        # dev --share
make desktop      # Electron + server
make fmt lint tc  # format / lint / typecheck
make test ARGS=apps/web/src/rightPanelStore.test.ts
make dist         # AppImage only → release/
make sync         # fetch + merge upstream/main
make bootstrap    # check Node / vp / apt (alias: make b, make doctor)
make pair         # mint pairing token
make clean
```

## Workstation bootstrap

```bash
make bootstrap
./scripts/dev-bootstrap-local.sh --fix   # sudo apt-install missing build deps
make deps
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
vp run install:desktop:local
./scripts/install-local-appimage.sh --skip-build
./scripts/install-local-appimage.sh --replace-stock   # also rewrites t3-code.desktop
```

Defaults:

- `~/Applications/T3-Code-local.AppImage`
- `~/.local/share/applications/t3-code-local.desktop` → “T3 Code (Local)”

Related: [#2](https://github.com/detroitpro/t3code/issues/2).
