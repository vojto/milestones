#!/usr/bin/env bash
#
# Sends the package scripts/build-mas.sh produced to App Store Connect and
# waits for Apple to finish processing it, which is when the build becomes
# something a version can be attached to.
#
# Uploading is not releasing. Creating the version, applying the metadata in
# ../metadata and submitting for review all come after; see the release skill
# in .claude/skills/release.

set -euo pipefail

APP_NAME="Milestones"
BUNDLE_ID="tech.median.milestones"
ASC_PROFILE="${ASC_PROFILE:-Median}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PKG="$REPO_ROOT/build/$APP_NAME.pkg"
BUILT_APP="$REPO_ROOT/src-tauri/target/universal-apple-darwin/release/bundle/macos/$APP_NAME.app"

if [ ! -f "$PKG" ]; then
  echo "upload-mas: no package at $PKG — run scripts/build-mas.sh first" >&2
  exit 1
fi

# A package, unlike an IPA, does not tell App Store Connect what is inside it,
# so the two version numbers travel alongside. They are read back off the
# bundle that went into the package rather than from configuration, so what is
# declared is always what was built.
plist_value() {
  /usr/libexec/PlistBuddy -c "Print :$1" "$BUILT_APP/Contents/Info.plist"
}
VERSION="$(plist_value CFBundleShortVersionString)"
BUILD_NUMBER="$(plist_value CFBundleVersion)"

# Looked up rather than hardcoded, so the identifier is stated once (here and
# in tauri.conf.json) instead of once more as a number nobody can read.
APP_ID="$(asc --profile "$ASC_PROFILE" apps list --bundle-id "$BUNDLE_ID" --output json |
  python3 -c 'import json, sys
apps = json.load(sys.stdin)["data"]
if not apps:
    sys.exit("upload-mas: no app in App Store Connect for '"$BUNDLE_ID"'")
print(apps[0]["id"])')"

echo "upload-mas: uploading $VERSION ($BUILD_NUMBER) to app $APP_ID"
asc --profile "$ASC_PROFILE" builds upload \
  --app "$APP_ID" \
  --pkg "$PKG" \
  --version "$VERSION" \
  --build-number "$BUILD_NUMBER" \
  --wait
