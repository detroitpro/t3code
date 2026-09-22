#!/usr/bin/env bash
# Fork-local workstation bootstrap for detroitpro/t3code.
# Checks (and optionally installs) tooling needed for `vp run dev` and
# `vp run dist:desktop:linux` on Ubuntu/Debian x86_64.
#
#   ./scripts/dev-bootstrap-local.sh           # check + print next steps
#   ./scripts/dev-bootstrap-local.sh --fix    # apt-install missing build deps
#   ./scripts/dev-bootstrap-local.sh --help
#
# Does not open PRs against upstream. Does not touch ~/.t3/userdata.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FIX=0
CHECK_ONLY=0

usage() {
  cat <<'EOF'
Usage: scripts/dev-bootstrap-local.sh [--fix] [--check-only] [--help]

  --fix        Install missing apt packages (sudo). Does not install Node/vp.
  --check-only  Exit 1 if anything required is missing (no hints beyond status).
  --help        Show this help.

Checks Node 24, vp, Rust/cargo, and Linux AppImage build deps, then prints
how to run `vp i`, `vp run dev`, and the local AppImage installer.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --fix) FIX=1; shift ;;
    --check-only) CHECK_ONLY=1; shift ;;
    --help|-h) usage; exit 0 ;;
    *)
      printf 'Unknown argument: %s\n' "$1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

ok=0
warn=0
fail=0

status() {
  local level="$1"
  shift
  case "$level" in
    ok) printf '  [ok]   %s\n' "$*"; ok=$((ok + 1)) ;;
    warn) printf '  [warn] %s\n' "$*"; warn=$((warn + 1)) ;;
    fail) printf '  [fail] %s\n' "$*"; fail=$((fail + 1)) ;;
  esac
}

have_cmd() {
  command -v "$1" >/dev/null 2>&1
}

apt_installed() {
  dpkg-query -W -f='${Status}' "$1" 2>/dev/null | grep -q 'install ok installed'
}

printf 'T3 Code local bootstrap (fork)\n'
printf 'repo: %s\n\n' "$ROOT"

# --- Node -----------------------------------------------------------------
node_bin=""
if have_cmd node; then
  node_bin="$(command -v node)"
fi
# Prefer an nvm Node 24 if the current node is wrong major.
if [[ -z "${NVM_DIR:-}" && -s "$HOME/.nvm/nvm.sh" ]]; then
  # shellcheck disable=SC1091
  . "$HOME/.nvm/nvm.sh"
fi
if have_cmd nvm; then
  # nvm is a shell function; best-effort select 24 without failing the script.
  nvm use 24 >/dev/null 2>&1 || true
  if have_cmd node; then
    node_bin="$(command -v node)"
  fi
fi

if [[ -n "$node_bin" ]]; then
  node_ver="$("$node_bin" -v 2>/dev/null | sed 's/^v//')"
  node_major="${node_ver%%.*}"
  node_minor="${node_ver#*.}"
  node_minor="${node_minor%%.*}"
  if [[ "$node_major" == "24" ]]; then
    if [[ "$node_minor" -ge 13 ]]; then
      status ok "Node $node_ver ($node_bin)"
    else
      status warn "Node $node_ver — package.json engines wants ^24.13.1; upgrade with nvm if builds fail"
    fi
  else
    status fail "Node $node_ver — need major 24 (engines.node: ^24.13.1)"
  fi
else
  status fail "node not on PATH — install Node 24 (nvm recommended)"
fi

# --- vp -------------------------------------------------------------------
if have_cmd vp; then
  status ok "vp ($(command -v vp))"
else
  status fail "vp not on PATH — install with: curl -fsSL https://vite.plus | bash"
fi

# --- Rust (resource monitor / desktop native bits) ------------------------
if have_cmd cargo && have_cmd rustc; then
  status ok "Rust $(rustc --version 2>/dev/null | awk '{print $2}')"
else
  status warn "cargo/rustc missing — needed for some desktop native pieces; install via rustup"
fi

# --- Linux AppImage apt deps ---------------------------------------------
APT_DEPS=(build-essential libsecret-1-dev pkg-config imagemagick)
missing_apt=()
if have_cmd dpkg-query; then
  for pkg in "${APT_DEPS[@]}"; do
    if apt_installed "$pkg"; then
      status ok "apt $pkg"
    else
      missing_apt+=("$pkg")
      status fail "apt package missing: $pkg"
    fi
  done
else
  status warn "dpkg-query not found — skip apt checks (non-Debian?)"
fi

if [[ ${#missing_apt[@]} -gt 0 && "$FIX" -eq 1 ]]; then
  printf '\nInstalling missing apt packages (sudo)...\n'
  sudo apt-get update
  sudo apt-get install -y "${missing_apt[@]}"
  for pkg in "${missing_apt[@]}"; do
    if apt_installed "$pkg"; then
      status ok "apt $pkg (installed)"
      fail=$((fail - 1))
    else
      status fail "apt $pkg still missing after install"
    fi
  done
fi

# --- node_modules ---------------------------------------------------------
if [[ -d "$ROOT/node_modules" ]]; then
  status ok "node_modules present"
else
  status warn "node_modules missing — run: vp i"
fi

printf '\nSummary: %s ok, %s warn, %s fail\n' "$ok" "$warn" "$fail"

if [[ "$CHECK_ONLY" -eq 1 ]]; then
  [[ "$fail" -eq 0 ]] || exit 1
  exit 0
fi

cat <<EOF

Next steps
----------
  cd $ROOT
  vp i
  vp run dev                          # pair via the printed pairing URL
  # worktree state: $ROOT/.t3  (never use live ~/.t3/userdata for dev)

Build + install a clickable local AppImage (taskbar):
  vp run install:desktop:local        # builds then installs
  # or: ./scripts/install-local-appimage.sh --help

See FORK.md for the fork-only workflow (GitHub work on detroitpro/t3code only).
EOF

[[ "$fail" -eq 0 ]] || exit 1
exit 0
