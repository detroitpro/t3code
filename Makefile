# Fork-local developer CLI (`detroitpro/t3code`).
# Prefer `make <target>` over remembering script paths.
#
#   make          # menu
#   make i        # install checked-out tree as local AppImage
#   make install  # same as i

.DEFAULT_GOAL := help
.PHONY: help menu i install bootstrap b doctor

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
	@printf '  $(C_DIM)────────────────────────────────────────────$(C_RESET)\n'
endef

# -----------------------------------------------------------------------------
# Menu
# -----------------------------------------------------------------------------
help menu:
	$(BANNER)
	@printf '  $(C_BOLD)$(C_WHITE)Workstation$(C_RESET)\n'
	$(RULE)
	@printf '  $(C_GREEN)$(C_BOLD)i$(C_RESET)$(C_GREEN), install$(C_RESET)     Install this checkout as a local AppImage\n'
	@printf '                     $(C_DIM)→ ~/Applications/T3-Code-local.AppImage$(C_RESET)\n'
	@printf '                     $(C_DIM)→ “T3 Code (Local)” in the app menu / dock$(C_RESET)\n'
	@printf '\n'
	@printf '  $(C_YELLOW)$(C_BOLD)b$(C_RESET)$(C_YELLOW), bootstrap$(C_RESET)   Check Node / vp / apt deps for this machine\n'
	@printf '  $(C_YELLOW)$(C_BOLD)doctor$(C_RESET)           Same as bootstrap (alias)\n'
	@printf '\n'
	@printf '  $(C_BOLD)$(C_WHITE)Notes$(C_RESET)\n'
	$(RULE)
	@printf '  $(C_DIM)• Builds whatever branch/commit you have checked out.$(C_RESET)\n'
	@printf '  $(C_DIM)• Does not publish to upstream or touch remote Connect clients.$(C_RESET)\n'
	@printf '  $(C_DIM)• See FORK.md  ·  make i --help is not a thing; use: make help$(C_RESET)\n'
	@printf '\n'

# -----------------------------------------------------------------------------
# Install — primary human path for “run my fork on this box”
# -----------------------------------------------------------------------------
i: install

install:
	$(BANNER)
	@printf '  $(C_GREEN)$(C_BOLD)▸ install$(C_RESET)  building + installing local AppImage from\n'
	@printf '             $(C_CYAN)%s$(C_RESET)\n' "$(ROOT)"
	@printf '             $(C_DIM)%s$(C_RESET)\n\n' "$$(git -C '$(ROOT)' rev-parse --abbrev-ref HEAD 2>/dev/null) @ $$(git -C '$(ROOT)' rev-parse --short HEAD 2>/dev/null)"
	@bash "$(ROOT)/scripts/install-local-appimage.sh"
	@printf '\n  $(C_GREEN)$(C_BOLD)✓ install finished$(C_RESET)\n'
	@printf '  $(C_DIM)Quit any running T3 Code, then launch “T3 Code (Local)”.$(C_RESET)\n\n'

# -----------------------------------------------------------------------------
# Bootstrap / doctor
# -----------------------------------------------------------------------------
b: bootstrap
doctor: bootstrap

bootstrap:
	$(BANNER)
	@printf '  $(C_YELLOW)$(C_BOLD)▸ bootstrap$(C_RESET)  checking workstation tooling\n\n'
	@bash "$(ROOT)/scripts/dev-bootstrap-local.sh"
