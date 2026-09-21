# Fork-local developer CLI (`detroitpro/t3code`).
# Prefer `make <target>` over remembering script / vp paths.
#
#   make            # menu
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

# Optional args: make test ARGS='apps/web/src/rightPanelStore.test.ts'
ARGS ?=

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
	@command -v vp >/dev/null 2>&1 || { \
		printf '  $(C_RED)$(C_BOLD)vp not on PATH$(C_RESET) — run $(C_YELLOW)make bootstrap$(C_RESET) then install vp\n'; \
		exit 1; \
	}
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
	@printf '  $(C_YELLOW)$(C_BOLD)b$(C_RESET)$(C_YELLOW), bootstrap$(C_RESET)    Check Node / vp / apt deps ($(C_YELLOW)doctor$(C_RESET))\n'
	@printf '  $(C_YELLOW)$(C_BOLD)deps$(C_RESET)$(C_YELLOW), setup$(C_RESET)       $(C_DIM)vp i$(C_RESET) — install package dependencies\n'
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
	@printf '  $(C_DIM)Fork only · see FORK.md · never PR against pingdotgg/t3code$(C_RESET)\n\n'

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
	$(call STEP,$(C_YELLOW),deps,vp i)
	$(NEED_VP)
	@cd "$(ROOT)" && vp i
	@printf '  $(C_GREEN)$(C_BOLD)✓ deps ready$(C_RESET)\n\n'

# -----------------------------------------------------------------------------
# Develop
# -----------------------------------------------------------------------------
d: dev

dev:
	$(BANNER)
	$(call STEP,$(C_BLUE),dev,web + server — open the pairing URL from stdout)
	$(NEED_VP)
	@cd "$(ROOT)" && vp run dev

share:
	$(BANNER)
	$(call STEP,$(C_BLUE),share,dev with --share (tailnet pairing URL))
	$(NEED_VP)
	@cd "$(ROOT)" && vp run dev --share

desktop:
	$(BANNER)
	$(call STEP,$(C_BLUE),desktop,Electron + server)
	$(NEED_VP)
	@cd "$(ROOT)" && vp run dev:desktop

server:
	$(BANNER)
	$(call STEP,$(C_BLUE),server,server only)
	$(NEED_VP)
	@cd "$(ROOT)" && vp run dev:server

web:
	$(BANNER)
	$(call STEP,$(C_BLUE),web,web only)
	$(NEED_VP)
	@cd "$(ROOT)" && vp run dev:web

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
	@cd "$(ROOT)" && vp fmt

lint:
	$(BANNER)
	$(call STEP,$(C_MAGENTA),lint,vp lint)
	$(NEED_VP)
	@cd "$(ROOT)" && vp lint --report-unused-disable-directives

tc: typecheck

typecheck:
	$(BANNER)
	$(call STEP,$(C_MAGENTA),typecheck,repo-wide — prefer scoped checks when iterating)
	$(NEED_VP)
	@cd "$(ROOT)" && vp run typecheck

test:
	$(BANNER)
	$(call STEP,$(C_MAGENTA),test,$(if $(ARGS),vp test run $(ARGS),vp test / vp run test — pass ARGS=file))
	$(NEED_VP)
ifeq ($(strip $(ARGS)),)
	@cd "$(ROOT)" && vp run test
else
	@cd "$(ROOT)" && vp test run $(ARGS)
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
	@cd "$(ROOT)" && vp run dist:desktop:linux
	@printf '  $(C_GREEN)$(C_BOLD)✓ artifact in release/$(C_RESET)  $(C_DIM)(install with: make i -- use install script --skip-build)$(C_RESET)\n\n'

sync: sync-upstream

sync-upstream:
	$(BANNER)
	$(call STEP,$(C_CYAN),sync,fetch upstream + merge upstream/main)
	@git -C "$(ROOT)" remote get-url upstream >/dev/null 2>&1 || { \
		printf '  $(C_RED)no upstream remote$(C_RESET) — add: git remote add upstream https://github.com/pingdotgg/t3code\n'; \
		exit 1; \
	}
	@git -C "$(ROOT)" fetch upstream
	@git -C "$(ROOT)" merge upstream/main
	@printf '  $(C_GREEN)$(C_BOLD)✓ synced from upstream/main$(C_RESET)\n'
	@printf '  $(C_DIM)Push when ready: git push origin HEAD$(C_RESET)\n\n'

clean:
	$(BANNER)
	$(call STEP,$(C_RED),clean,node_modules + dist caches)
	@cd "$(ROOT)" && vp run clean
	@printf '  $(C_GREEN)$(C_BOLD)✓ clean$(C_RESET)\n\n'
