#!/usr/bin/env bash
# Smoke-test install-local-appimage.sh without a full Electron build.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

mkdir -p "$ROOT/release" "$TMP/Applications" "$TMP/applications"
# Fake AppImages with staggered mtimes — installer must pick the newest.
older="$ROOT/release/T3-Code-0.0.0-test-old-x86_64.AppImage"
newer="$ROOT/release/T3-Code-0.0.0-test-new-x86_64.AppImage"
printf 'old' >"$older"
sleep 1
printf 'new' >"$newer"
chmod +x "$older" "$newer"
trap 'rm -f "$older" "$newer"; rm -rf "$TMP"' EXIT

HOME="$TMP" XDG_DATA_HOME="$TMP" \
  "$ROOT/scripts/install-local-appimage.sh" \
  --skip-build \
  --dest "$TMP/Applications/T3-Code-local.AppImage" \
  --desktop-id t3-code-local

installed="$TMP/Applications/T3-Code-local.AppImage"
desktop="$TMP/.local/share/applications/t3-code-local.desktop"

[[ -x "$installed" ]] || {
  echo "missing installed AppImage" >&2
  exit 1
}
[[ "$(cat "$installed")" == "new" ]] || {
  echo "did not install newest AppImage" >&2
  exit 1
}
[[ -f "$desktop" ]] || {
  echo "missing desktop entry" >&2
  exit 1
}
grep -q "Exec=${installed} %U" "$desktop" || {
  echo "desktop Exec= mismatch" >&2
  exit 1
}
grep -q "Name=T3 Code (Local)" "$desktop" || {
  echo "desktop Name= mismatch" >&2
  exit 1
}

# Idempotent second run
HOME="$TMP" \
  "$ROOT/scripts/install-local-appimage.sh" \
  --skip-build \
  --dest "$TMP/Applications/T3-Code-local.AppImage" \
  --desktop-id t3-code-local

echo "install-local-appimage smoke ok"
