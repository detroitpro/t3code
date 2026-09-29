# Personal repo notes (`detroitpro/t3code`)

[`detroitpro/t3code`](https://github.com/detroitpro/t3code) is the **canonical** GitHub
repo for this checkout. It is a **standalone** personal copy (left the GitHub fork
network). Never open PRs, issues, or discussions against any other GitHub copy of
T3 Code.

Verify: `gh api repos/detroitpro/t3code --jq .fork` should be `false`. If it is
still `true`, finish **Settings → Danger Zone → Leave fork network**.

## Remotes and `gh`

Keep **only** `origin` → `detroitpro/t3code`. Do **not** add a permanent
`upstream` remote: when GitHub still treats the repo as a fork, a named
`upstream` remote makes `gh pr create` open against the wrong base.

```bash
gh repo set-default detroitpro/t3code   # once per clone
# always prefer an explicit repo flag:
gh pr create --repo detroitpro/t3code ...
gh issue create --repo detroitpro/t3code ...
```

## Catching up with stable releases

Use the **`merge-upstream`** skill: resolve the latest stable `vX.Y.Z` tag via a
**one-shot** `git fetch` URL (no lasting remote) → triage → one plan issue here →
cherry-pick take items one by one. Never tip-of-main, nightlies, or previews
unless you explicitly override.

`make sync` is disabled (it used to merge tip-of-main through a permanent
`upstream` remote). Prefer the skill.

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
make sync         # refused — use merge-upstream skill / stable cherry-picks
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
gh repo set-default detroitpro/t3code     # pin gh to this repo
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

Related: local AppImage automation (former issue #2; recreate from
`.local/fork-archive/` if needed after Leave fork network).
