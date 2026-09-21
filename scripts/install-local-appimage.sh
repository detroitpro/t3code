#!/usr/bin/env bash
# Fork-local: build a Linux AppImage from source and install it for the
# current user (taskbar / app menu), without touching upstream releases.
#
#   ./scripts/install-local-appimage.sh
#   ./scripts/install-local-appimage.sh --skip-build
#   vp run install:desktop:local
#
# Defaults install a *separate* local launcher so the stock AppImage is kept:
#   ~/Applications/T3-Code-local.AppImage
#   ~/.local/share/applications/t3-code-local.desktop
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKIP_BUILD=0
REPLACE_STOCK=0
DEST="${T3CODE_LOCAL_APPIMAGE_DEST:-$HOME/Applications/T3-Code-local.AppImage}"
DESKTOP_ID="${T3CODE_LOCAL_DESKTOP_ID:-t3-code-local}"
ARCH_SUFFIX="x86_64"

usage() {
  cat <<'EOF'
Usage: scripts/install-local-appimage.sh [options]

  --skip-build          Do not run dist:desktop:linux; use newest release/*.AppImage
  --dest PATH           Installed AppImage path (default: ~/Applications/T3-Code-local.AppImage)
  --desktop-id ID       Desktop entry id without .desktop (default: t3-code-local)
  --replace-stock       Also rewrite ~/.local/share/applications/t3-code.desktop
                        to point at --dest (overwrites the stock launcher Exec=)
  --help                Show this help

Environment overrides: T3CODE_LOCAL_APPIMAGE_DEST, T3CODE_LOCAL_DESKTOP_ID
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-build) SKIP_BUILD=1; shift ;;
    --dest)
      DEST="${2:?--dest requires a path}"
      shift 2
      ;;
    --desktop-id)
      DESKTOP_ID="${2:?--desktop-id requires an id}"
      shift 2
      ;;
    --replace-stock) REPLACE_STOCK=1; shift ;;
    --help|-h) usage; exit 0 ;;
    *)
      printf 'Unknown argument: %s\n' "$1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

fail() {
  printf 'install-local-appimage: %s\n' "$1" >&2
  exit 1
}

if [[ "$(uname -s)" != "Linux" ]]; then
  fail "Linux only (builds AppImage)"
fi

if [[ "$SKIP_BUILD" -eq 0 ]]; then
  command -v vp >/dev/null 2>&1 || fail "vp not on PATH — run scripts/dev-bootstrap-local.sh first"
  printf 'Building desktop AppImage (vp run dist:desktop:linux)...\n'
  (
    cd "$ROOT"
    vp run dist:desktop:linux
  )
fi

release_dir="$ROOT/release"
shopt -s nullglob
candidates=("$release_dir"/T3-Code-*-"${ARCH_SUFFIX}".AppImage)
shopt -u nullglob

if [[ ${#candidates[@]} -eq 0 ]]; then
  fail "no AppImage matching T3-Code-*-${ARCH_SUFFIX}.AppImage in $release_dir (build first or drop --skip-build)"
fi

# Newest by mtime.
src=""
newest_mtime=0
for candidate in "${candidates[@]}"; do
  mtime="$(stat -c '%Y' "$candidate")"
  if [[ -z "$src" || "$mtime" -gt "$newest_mtime" ]]; then
    src="$candidate"
    newest_mtime="$mtime"
  fi
done
[[ -n "$src" && -f "$src" ]] || fail "could not resolve AppImage source"

dest_dir="$(dirname "$DEST")"
mkdir -p "$dest_dir"
install -m 755 "$src" "$DEST"
printf 'Installed AppImage:\n  %s\n  (from %s)\n' "$DEST" "$src"

write_desktop() {
  local id="$1"
  local path="$2"
  local name="$3"
  local applications="$HOME/.local/share/applications"
  mkdir -p "$applications"
  local file="$applications/${id}.desktop"
  cat >"$file" <<EOF
[Desktop Entry]
Type=Application
Name=${name}
Comment=Local fork build of T3 Code (detroitpro/t3code)
Exec=${DEST} %U
Icon=t3-code
Terminal=false
Categories=Development;IDE;
StartupNotify=true
EOF
  printf 'Wrote desktop entry:\n  %s\n' "$file"
}

write_desktop "$DESKTOP_ID" "$DEST" "T3 Code (Local)"

if [[ "$REPLACE_STOCK" -eq 1 ]]; then
  write_desktop "t3-code" "$DEST" "T3 Code"
  printf 'Replaced stock t3-code.desktop Exec= to local build.\n'
fi

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$HOME/.local/share/applications" >/dev/null 2>&1 || true
fi

cat <<EOF

Done. Quit any running T3 Code instance, then launch "T3 Code (Local)" from the
app menu / taskbar (desktop id: ${DESKTOP_ID}).

Stock AppImage was left alone unless you passed --replace-stock.
EOF
