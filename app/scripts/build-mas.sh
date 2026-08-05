#!/usr/bin/env bash
#
# Builds the Mac App Store copy and leaves a signed installer package ready to
# upload. Three things make it different from `install-local.sh`:
#
#   - it is universal, because the App Store serves one binary to both
#     architectures;
#   - it is sandboxed, so the document lands in the app's container rather than
#     in ~/Library/Application Support (see entitlements.mas.plist);
#   - it is signed for distribution and wrapped in a .pkg, which is the only
#     shape App Store Connect accepts for a Mac app.
#
# Tauri does the bundling but not the signing: the provisioning profile has to
# be inside the bundle before the signature is taken, and Tauri has no step
# there. So it builds unsigned and everything after that is here.
#
# Run scripts/upload-mas.sh afterwards to send the package up.

set -euo pipefail

APP_NAME="Milestones"
TEAM_ID="Q4C48EKH9Z"
APP_IDENTITY="Apple Distribution: Median Tech, s.r.o. ($TEAM_ID)"
INSTALLER_IDENTITY="3rd Party Mac Developer Installer: Median Tech, s.r.o. ($TEAM_ID)"
PROFILE_TYPE="MAC_APP_STORE"
ASC_PROFILE="${ASC_PROFILE:-Median}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILT_APP="$REPO_ROOT/src-tauri/target/universal-apple-darwin/release/bundle/macos/$APP_NAME.app"
ENTITLEMENTS="$REPO_ROOT/src-tauri/entitlements.mas.plist"
OUT_DIR="$REPO_ROOT/build"
PKG="$OUT_DIR/$APP_NAME.pkg"

cd "$REPO_ROOT"

require_identity() {
  security find-identity -v | grep -qF "$1" ||
    { echo "build-mas: no signing identity \"$1\" in the keychain" >&2; exit 1; }
}
require_identity "$APP_IDENTITY"
require_identity "$INSTALLER_IDENTITY"

# App Store Connect rejects an upload whose CFBundleVersion it has seen before,
# so the build number has to move on its own. The commit count does, and needs
# nothing checked in to remember where it got to.
BUILD_NUMBER="$(git rev-list --count HEAD)"
echo "build-mas: build $BUILD_NUMBER"

npx tauri build \
  --target universal-apple-darwin \
  --bundles app \
  --config "{\"bundle\":{\"macOS\":{\"bundleVersion\":\"$BUILD_NUMBER\"}}}"

if [ ! -d "$BUILT_APP" ]; then
  echo "build-mas: no bundle at $BUILT_APP" >&2
  exit 1
fi

# The profile is not kept in the repo: it expires, it is regenerated whenever the
# distribution certificate is, and App Store Connect always has the current one.
echo "build-mas: fetching the provisioning profile"
PROFILE_ID="$(asc --profile "$ASC_PROFILE" profiles list --profile-type "$PROFILE_TYPE" \
  --profile-state ACTIVE --output json |
  python3 -c 'import json, sys; print(json.load(sys.stdin)["data"][0]["id"])')"
asc --profile "$ASC_PROFILE" profiles download \
  --id "$PROFILE_ID" \
  --output "$BUILT_APP/Contents/embedded.provisionprofile" >/dev/null

echo "build-mas: signing"
codesign --force --timestamp \
  --sign "$APP_IDENTITY" \
  --entitlements "$ENTITLEMENTS" \
  "$BUILT_APP"
codesign --verify --strict --verbose=2 "$BUILT_APP"

echo "build-mas: packaging"
mkdir -p "$OUT_DIR"
rm -f "$PKG"
productbuild --component "$BUILT_APP" /Applications --sign "$INSTALLER_IDENTITY" "$PKG"

echo "build-mas: wrote $PKG"
