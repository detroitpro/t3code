# Fork-local developer CLI (`detroitpro/t3code`).
# Prefer `make <target>` over remembering script / vp paths.
#
# Vite+ (`vp`) is repo-local: node_modules/.bin/vp from `vite-plus` (pnpm).
# Do not install global Vite+ — it shims yarn/npm and breaks other repos.
#
#   make            # menu
#   make deps       # pnpm install → local vp (then vp i)
#   make i          # install checkout as local AppImage
#   make dev        # web + server
#   make help       # this menu

.DEFAULT_GOAL := help

.PHONY: help menu \
	i install bootstrap b doctor deps setup \
	dev d share desktop server web \
	fmt lint tc typecheck test test-install \
	dist appimage clean pair sync sync-upstream

# -----------------------------------------------------------------------------
# Terminal UI (ANSI). Disable with NO_COLOR=1 or when stdout is not a TTY.
# -----------------------------------------------------------------------------
ifeq ($(NO_COLOR),)
  ifeq ($(shell test -t 1 && echo yes),yes)
    C_RESET  := \033[0m
    C_DIM    := \033[2m
    C_BOLD   := \033[1m
    C_RED    := \033[31m
    C_GREEN  := \033[32m
    C_YELLOW := \033[33m
    C_BLUE   := \033[34m
    C_MAGENTA:= \033[35m
    C_CYAN   := \033[36m
    C_WHITE  := \033[37m
  endif
endif

ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
VP := $(ROOT)/node_modules/.bin/vp
# Prefer repo-local bins for all recipes (vp, pnpm shims, etc.).
export PATH := $(ROOT)/node_modules/.bin:$(PATH)

# Optional args: make test ARGS='apps/web/src/rightPanelStore.test.ts'
ARGS ?=
# Keep in sync with package.json "packageManager".
PNPM_VERSION := 11.10.0

define BANNER
	@printf '$(C_CYAN)$(C_BOLD)\n'
	@printf '  ██████████ ████████ \n'
	@printf '    ███       ▄██▀       $(C_WHITE)T3 Code$(C_CYAN)\n'
	@printf '    ███       ████▄      $(C_DIM)fork makefile$(C_CYAN)\n'
	@printf '    ███    ▄     ███\n'
	@printf '    ███    ███████▀ \n'
	@printf '$(C_RESET)\n'
endef

define RULE
	@printf '  $(C_DIM)────────────────────────────────────────────────$(C_RESET)\n'
endef

define STEP
	@printf '  $(1)$(C_BOLD)▸ $(2)$(C_RESET)  $(3)\n\n'
endef

define NEED_VP
	@test -x '$(VP)' || { \
		printf '  $(C_RED)$(C_BOLD)repo-local vp missing$(C_RESET) — run $(C_YELLOW)make deps$(C_RESET) (installs via pnpm; no global Vite+)\n'; \
		exit 1; \
	}
endef

define ENSURE_PNPM
	@if ! command -v pnpm >/dev/null 2>&1; then \
		if ! command -v corepack >/dev/null 2>&1; then \
			printf '  $(C_RED)$(C_BOLD)pnpm/corepack missing$(C_RESET) — install Node 24 (nvm) then retry\n'; \
			exit 1; \
		fi; \
		corepack enable >/dev/null 2>&1 || true; \
		corepack prepare pnpm@$(PNPM_VERSION) --activate; \
	fi
endef

GIT_REF = $$(git -C '$(ROOT)' rev-parse --abbrev-ref HEAD 2>/dev/null) @ $$(git -C '$(ROOT)' rev-parse --short HEAD 2>/dev/null)

# -----------------------------------------------------------------------------
# Menu
# -----------------------------------------------------------------------------
help menu:
	$(BANNER)
	@printf '  $(C_BOLD)$(C_WHITE)Install / workstation$(C_RESET)\n'
	$(RULE)
	@printf '  $(C_GREEN)$(C_BOLD)i$(C_RESET)$(C_GREEN), install$(C_RESET)      Build + install this checkout as local AppImage\n'
	@printf '  $(C_YELLOW)$(C_BOLD)b$(C_RESET)$(C_YELLOW), bootstrap$(C_RESET)    Check Node / repo-local vp / apt ($(C_YELLOW)doctor$(C_RESET))\n'
	@printf '  $(C_YELLOW)$(C_BOLD)deps$(C_RESET)$(C_YELLOW), setup$(C_RESET)       Install deps + repo-local $(C_DIM)vp$(C_RESET) via pnpm / $(C_DIM)vp i$(C_RESET)\n'
	@printf '\n'
	@printf '  $(C_BOLD)$(C_WHITE)Develop$(C_RESET)\n'
	$(RULE)
	@printf '  $(C_BLUE)$(C_BOLD)d$(C_RESET)$(C_BLUE), dev$(C_RESET)            Web + server ($(C_DIM)scripts/dev-runner.ts$(C_RESET))\n'
	@printf '  $(C_BLUE)$(C_BOLD)share$(C_RESET)              Dev with tailnet share + pairing URL\n'
	@printf '  $(C_BLUE)$(C_BOLD)desktop$(C_RESET)            Electron desktop + server\n'
	@printf '  $(C_BLUE)$(C_BOLD)server$(C_RESET) / $(C_BLUE)$(C_BOLD)web$(C_RESET)      One side only\n'
	@printf '  $(C_BLUE)$(C_BOLD)pair$(C_RESET)               Mint a fresh pairing token\n'
	@printf '\n'
	@printf '  $(C_BOLD)$(C_WHITE)Check$(C_RESET)\n'
	$(RULE)
	@printf '  $(C_MAGENTA)$(C_BOLD)fmt$(C_RESET)                Format ($(C_DIM)vp fmt$(C_RESET))\n'
	@printf '  $(C_MAGENTA)$(C_BOLD)lint$(C_RESET)               Lint\n'
	@printf '  $(C_MAGENTA)$(C_BOLD)tc$(C_RESET)$(C_MAGENTA), typecheck$(C_RESET)     Typecheck (repo-wide — slow)\n'
	@printf '  $(C_MAGENTA)$(C_BOLD)test$(C_RESET)               Tests  $(C_DIM)ARGS=path/to/file.test.ts$(C_RESET)\n'
	@printf '  $(C_MAGENTA)$(C_BOLD)test-install$(C_RESET)       Smoke-test local AppImage installer\n'
	@printf '\n'
	@printf '  $(C_BOLD)$(C_WHITE)Build / sync$(C_RESET)\n'
	$(RULE)
	@printf '  $(C_GREEN)$(C_BOLD)dist$(C_RESET)$(C_GREEN), appimage$(C_RESET)    Build Linux AppImage only → $(C_DIM)release/$(C_RESET)\n'
	@printf '  $(C_CYAN)$(C_BOLD)sync$(C_RESET)               Fetch + merge $(C_DIM)upstream/main$(C_RESET) into this branch\n'
	@printf '  $(C_RED)$(C_BOLD)clean$(C_RESET)              Remove node_modules / dist caches\n'
	@printf '\n'
	@printf '  $(C_DIM)Checkout: %s$(C_RESET)\n' "$(GIT_REF)"
	@printf '  $(C_DIM)Fork only · see FORK.md · GitHub work on detroitpro/t3code only$(C_RESET)\n\n'

# -----------------------------------------------------------------------------
# Install / workstation
# -----------------------------------------------------------------------------
i: install

install:
	$(BANNER)
	$(call STEP,$(C_GREEN),install,building + installing local AppImage)
	@printf '             $(C_CYAN)%s$(C_RESET)\n' "$(ROOT)"
	@printf '             $(C_DIM)%s$(C_RESET)\n\n' "$(GIT_REF)"
	@bash "$(ROOT)/scripts/install-local-appimage.sh"
	@printf '\n  $(C_GREEN)$(C_BOLD)✓ install finished$(C_RESET)\n'
	@printf '  $(C_DIM)Quit any running T3 Code, then launch “T3 Code (Local)”.$(C_RESET)\n\n'

b: bootstrap
doctor: bootstrap

bootstrap:
	$(BANNER)
	$(call STEP,$(C_YELLOW),bootstrap,checking workstation tooling)
	@bash "$(ROOT)/scripts/dev-bootstrap-local.sh"

deps setup:
	$(BANNER)
	$(call STEP,$(C_YELLOW),deps,pnpm install → node_modules/.bin/vp)
	$(ENSURE_PNPM)
	@if [ ! -x "$(VP)" ]; then \
		printf '  $(C_DIM)bootstrapping repo-local vp via pnpm@$(PNPM_VERSION)$(C_RESET)\n'; \
		cd "$(ROOT)" && pnpm install; \
	else \
		cd "$(ROOT)" && "$(VP)" i; \
	fi
	@test -x "$(VP)" || { \
		printf '  $(C_RED)vp still missing at $(VP)$(C_RESET)\n'; \
		exit 1; \
	}
	@printf '  $(C_GREEN)$(C_BOLD)✓ deps ready$(C_RESET)  $(C_DIM)%s$(C_RESET)\n\n' "$$("$(VP)" --version 2>/dev/null | head -1)"

# -----------------------------------------------------------------------------
# Develop
# -----------------------------------------------------------------------------
d: dev

dev:
	$(BANNER)
	$(call STEP,$(C_BLUE),dev,web + server — open the pairing URL from stdout)
	$(NEED_VP)
	@cd "$(ROOT)" && "$(VP)" run dev

share:
	$(BANNER)
	$(call STEP,$(C_BLUE),share,dev with --share (tailnet pairing URL))
	$(NEED_VP)
	@cd "$(ROOT)" && "$(VP)" run dev --share

desktop:
	$(BANNER)
	$(call STEP,$(C_BLUE),desktop,Electron + server)
	$(NEED_VP)
	@cd "$(ROOT)" && "$(VP)" run dev:desktop

server:
	$(BANNER)
	$(call STEP,$(C_BLUE),server,server only)
	$(NEED_VP)
	@cd "$(ROOT)" && "$(VP)" run dev:server

web:
	$(BANNER)
	$(call STEP,$(C_BLUE),web,web only)
	$(NEED_VP)
	@cd "$(ROOT)" && "$(VP)" run dev:web

pair:
	$(BANNER)
	$(call STEP,$(C_BLUE),pair,mint pairing token)
	@cd "$(ROOT)" && node apps/server/src/bin.ts pair

# -----------------------------------------------------------------------------
# Check
# -----------------------------------------------------------------------------
fmt:
	$(BANNER)
	$(call STEP,$(C_MAGENTA),fmt,vp fmt)
	$(NEED_VP)
	@cd "$(ROOT)" && "$(VP)" fmt

lint:
	$(BANNER)
	$(call STEP,$(C_MAGENTA),lint,vp lint)
	$(NEED_VP)
	@cd "$(ROOT)" && "$(VP)" lint --report-unused-disable-directives

tc: typecheck

typecheck:
	$(BANNER)
	$(call STEP,$(C_MAGENTA),typecheck,repo-wide — prefer scoped checks when iterating)
	$(NEED_VP)
	@cd "$(ROOT)" && "$(VP)" run typecheck

test:
	$(BANNER)
	$(call STEP,$(C_MAGENTA),test,$(if $(ARGS),vp test run $(ARGS),vp test / vp run test — pass ARGS=file))
	$(NEED_VP)
ifeq ($(strip $(ARGS)),)
	@cd "$(ROOT)" && "$(VP)" run test
else
	@cd "$(ROOT)" && "$(VP)" test run $(ARGS)
endif

test-install:
	$(BANNER)
	$(call STEP,$(C_MAGENTA),test-install,AppImage installer smoke)
	@bash "$(ROOT)/scripts/install-local-appimage.smoke.sh"

# -----------------------------------------------------------------------------
# Build / sync / clean
# -----------------------------------------------------------------------------
dist: appimage

appimage:
	$(BANNER)
	$(call STEP,$(C_GREEN),appimage,vp run dist:desktop:linux → release/)
	$(NEED_VP)
	@cd "$(ROOT)" && "$(VP)" run dist:desktop:linux
	@printf '  $(C_GREEN)$(C_BOLD)✓ artifact in release/$(C_RESET)  $(C_DIM)(install with: make i — or install script --skip-build)$(C_RESET)\n\n'

sync: sync-upstream

sync-upstream:
	$(BANNER)
	$(call STEP,$(C_CYAN),sync,fetch upstream + merge upstream/main)
	@git -C "$(ROOT)" remote get-url upstream >/dev/null 2>&1 || { \
		printf '  $(C_RED)no upstream remote$(C_RESET) — configure git remote upstream for sync (see FORK.md)\n'; \
		exit 1; \
	}
	@git -C "$(ROOT)" fetch upstream
	@git -C "$(ROOT)" merge upstream/main
	@printf '  $(C_GREEN)$(C_BOLD)✓ synced from upstream/main$(C_RESET)\n'
	@printf '  $(C_DIM)Push when ready: git push origin HEAD$(C_RESET)\n\n'

clean:
	$(BANNER)
	$(call STEP,$(C_RED),clean,node_modules + dist caches)
	@if [ -x "$(VP)" ]; then \
		cd "$(ROOT)" && "$(VP)" run clean; \
	else \
		cd "$(ROOT)" && rm -rf node_modules apps/*/node_modules packages/*/node_modules \
			apps/*/dist apps/*/dist-electron packages/*/dist .vite-plus apps/*/.vite-plus packages/*/.vite-plus; \
	fi
	@printf '  $(C_GREEN)$(C_BOLD)✓ clean$(C_RESET)\n\n'
