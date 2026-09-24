---
name: local-vp
description: >-
  Use repo-local Vite+ (node_modules/.bin/vp) via make or pnpm exec — never
  install global vp / curl vite.plus. Use when running vp, vp i, make deps,
  bootstrap/doctor, or package installs in detroitpro/t3code.
---

# Local Vite+ only

## Do

- `make deps` to install dependencies and create `node_modules/.bin/vp`
- `make d` / `make fmt` / `make lint` / `make tc` / `make test ARGS=…` for day-to-day work
- `./node_modules/.bin/vp …` or `pnpm exec vp …` when a script needs the binary directly

## Do not

- `curl -fsSL https://vite.plus | bash` (or Windows `irm … vite.plus`)
- Add `~/.local/share/vite-plus/bin` to shell rc / login `PATH`
- Tell the user to install a “global `vp` CLI”

## Why

Global Vite+ shims package managers and broke Yarn Classic repos on this workstation fleet. Policy: [FORK.md](../../../FORK.md), rule `.cursor/rules/local-vp.mdc`.
