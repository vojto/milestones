#!/usr/bin/env bash
#
# Builds the app and installs it into /Applications, replacing whatever is
# there. This is the staging copy: the same document as the dev build (the
# bundle identifier decides that, and it does not change), so a feature can be
# lived with in a real window rather than a `tauri dev` one.
#
# Only the .app is bundled — a .dmg is for shipping, and nothing here ships.

set -euo pipefail

APP_NAME="Milestones"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILT_APP="$REPO_ROOT/src-tauri/target/release/bundle/macos/$APP_NAME.app"
INSTALLED_APP="/Applications/$APP_NAME.app"

cd "$REPO_ROOT"
npx tauri build --bundles app

if [ ! -d "$BUILT_APP" ]; then
  echo "install-local: no bundle at $BUILT_APP" >&2
  exit 1
fi

# A running copy holds its own bundle open, and replacing it underneath leaves
# the app half on disk. Ask it to quit, wait for it to go, and only then insist
# — the process is named after the Cargo package, not after the bundle, so it
# is the bundle path that identifies it.
RUNNING="$INSTALLED_APP/Contents/MacOS/"
if pgrep -qf "$RUNNING"; then
  osascript -e "quit app \"$APP_NAME\"" || true
  for _ in $(seq 40); do
    pgrep -qf "$RUNNING" || break
    sleep 0.25
  done
  pgrep -qf "$RUNNING" && pkill -f "$RUNNING" || true
fi

rm -rf "$INSTALLED_APP"
ditto "$BUILT_APP" "$INSTALLED_APP"

echo "install-local: installed $INSTALLED_APP"
open "$INSTALLED_APP"
