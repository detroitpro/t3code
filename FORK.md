# Fork-only notes (`detroitpro/t3code`)

This fork tracks personal work that is **not** proposed upstream. Never open
PRs against `pingdotgg/t3code`. Keep `main` current with:

```bash
git fetch upstream
git checkout main
git merge upstream/main   # or rebase
git push origin main
```

## Workstation bootstrap

```bash
./scripts/dev-bootstrap-local.sh          # check tooling
./scripts/dev-bootstrap-local.sh --fix   # sudo apt-install missing build deps
vp i
vp run dev                                # use the printed pairing URL
```

Worktree state lives in this checkout's `.t3/`. Do not point a dev server at
live `~/.t3/userdata`.

## Local AppImage (taskbar install)

Build from source and install a **separate** launcher so the stock AppImage
stays untouched:

```bash
vp run install:desktop:local
# same as: ./scripts/install-local-appimage.sh
```

Defaults:

- `~/Applications/T3-Code-local.AppImage`
- `~/.local/share/applications/t3-code-local.desktop` → “T3 Code (Local)”

Useful flags:

```bash
./scripts/install-local-appimage.sh --skip-build
./scripts/install-local-appimage.sh --dest ~/Applications/T3-Code-local.AppImage
./scripts/install-local-appimage.sh --replace-stock   # also rewrites t3-code.desktop
```

Related: [#2](https://github.com/detroitpro/t3code/issues/2).
