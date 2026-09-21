# Fork-only notes (`detroitpro/t3code`)

This fork tracks personal work that is **not** proposed upstream. Never open
PRs against `pingdotgg/t3code`. Keep `main` current with:

```bash
git fetch upstream
git checkout main
git merge upstream/main   # or rebase
git push origin main
```

## Primary human CLI: `make`

```bash
make              # colorized menu
make i            # install this checkout as local AppImage (alias: make install)
make bootstrap    # check Node / vp / apt deps (alias: make b, make doctor)
```

## Workstation bootstrap

```bash
make bootstrap
./scripts/dev-bootstrap-local.sh --fix   # sudo apt-install missing build deps
vp i
vp run dev                                # use the printed pairing URL
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
