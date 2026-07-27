---
name: release
description: Build Milestones for the Mac App Store and submit it for review
---

You are releasing a build of Milestones to the Mac App Store. Follow the steps
below; do not improvise a different route to Apple.

All commands run from the repository root.

## Extra instructions

$ARGUMENTS

If none are given, do a normal release: bump the version if the App Store
already has this one, build, upload, apply the metadata, and submit — steps 1
through 7.

## Required tool: `asc`

The [App Store Connect CLI](https://asccli.sh) (`brew install asc`) is what
talks to Apple here. The `Median` auth profile is already registered against
the team's API key; every command below passes `--profile Median`, and the
scripts default to it. If the profile is gone, put it back with:

```bash
asc auth login --name "Median" \
  --key-id "Y6D3632NYG" \
  --issuer-id "69a6de8f-a1b4-47e3-e053-5b8c7c11a4d1" \
  --private-key ~/private_keys/AuthKey_Y6D3632NYG.p8
```

**The key never goes in this repository — it is public.** It lives in
`~/private_keys/`, and the copy of record is in the `whisper-memos` checkout at
`ios/fastlane/AuthKey_Y6D3632NYG.p8`.

## Constants

| Key               | Value                                                     |
| ----------------- | --------------------------------------------------------- |
| Bundle ID         | `tech.median.milestones`                                  |
| Team ID           | `Q4C48EKH9Z`                                              |
| App signing       | `Apple Distribution: Median Tech, s.r.o. (Q4C48EKH9Z)`    |
| Installer signing | `3rd Party Mac Developer Installer: Median Tech, s.r.o.`  |
| Provisioning      | `Milestones Mac App Store` (MAC_APP_STORE, fetched fresh) |
| Screenshot type   | `APP_DESKTOP`, 2880×1800                                  |

The app's numeric ID is never written down — every command resolves it from the
bundle ID:

```bash
asc --profile Median apps list --bundle-id tech.median.milestones --output table
```

## Steps

### 1. Decide the version

`src-tauri/tauri.conf.json` holds the marketing version. Compare it against
what is live:

```bash
curl -s "https://itunes.apple.com/lookup?bundleId=tech.median.milestones" |
  python3 -c "import sys,json; r=json.load(sys.stdin)['results']; print(r[0]['version'] if r else 'not on the store yet')"
```

If they match, raise `version` in `tauri.conf.json` before building. The build
number is not versioned — `build-mas.sh` takes it from the commit count, so
**commit before you build** or the build number will not match the tree that
produced it.

### 2. Build

```bash
./scripts/build-mas.sh
```

Universal, sandboxed, signed, and wrapped in `build/Milestones.pkg`. Read the
header of that script before changing anything in it, and
`src-tauri/entitlements.mas.plist` before touching the entitlements — the
network entitlement in there is load-bearing in a way that is not obvious.

### 3. Upload

```bash
./scripts/upload-mas.sh
```

This waits for Apple to finish processing. Expect several minutes. Note the
build's `CFBundleVersion`; the later steps want it.

### 4. Create the App Store version

```bash
asc --profile Median versions create \
  --app APP_ID --version "1.0.0" --platform MAC_OS \
  --copyright "2026 Median Tech, s.r.o." --output table
```

If a `DEVELOPER_REJECTED` version for that number already exists, update it
rather than creating another.

### 5. Apply metadata

The listing lives in `metadata/` in canonical `asc` form: `app-info/en-US.json`
is the name, subtitle and privacy policy URL; `version/<version>/en-US.json` is
the description, keywords and support URL. Copy the version directory when you
start a new version, and write `whatsNew` in the new one.

```bash
asc --profile Median metadata validate --dir ./metadata
asc --profile Median metadata apply --app APP_ID --version "1.0.0" --dir ./metadata --confirm
```

### 6. Screenshots

Only needed when the interface has changed — Apple keeps the previous set
otherwise.

```bash
asc --profile Median screenshots validate --path ./metadata/screenshots/APP_DESKTOP --device-type APP_DESKTOP
asc --profile Median screenshots upload --app APP_ID --version "1.0.0" \
  --path ./metadata/screenshots/APP_DESKTOP --device-type APP_DESKTOP
```

To retake them: run a build the way `Verifying the sandbox` in `AGENTS.md`
describes, seed its container with a document worth photographing, size the
window to 1440×900, then

```bash
asc screenshots capture --provider macos --bundle-id tech.median.milestones --name year
```

and compose the capture onto an opaque 2880×1800 canvas — the raw capture
carries the window shadow and an alpha channel, and App Store Connect takes
neither.

### 7. Submit

```bash
ASC_TIMEOUT=180s asc --profile Median review submit \
  --app APP_ID --version "1.0.0" --build BUILD_ID --confirm
```

Then confirm it landed:

```bash
asc --profile Median versions list --app APP_ID --output table
```

Expected end state: `WAITING_FOR_REVIEW`.

## Things that go wrong

**The MAS-signed app will not launch locally.** That is correct — a
distribution signature is killed on launch outside the store. To try a build by
hand, re-sign a copy with `Developer ID Application` and the same entitlements.

**A blank window.** The frontend did not load. Check that
`com.apple.security.network.client` is still in the entitlements: WKWebView
loads even the app's own `tauri://` frontend through WebKit's networking
process, and the sandbox refuses that process without it.

**Build number already used.** `git rev-list --count HEAD` did not move because
nothing was committed since the last upload. Commit, then rebuild.

**No installer identity.** The `3rd Party Mac Developer Installer` certificate
expires yearly. Recreate it, and note it does not come from Xcode:

```bash
asc --profile Median certificates create --certificate-type MAC_INSTALLER_DISTRIBUTION \
  --generate-csr --key-out ./installer.key --csr-out ./installer.csr
```

then convert the returned `certificateContent` to a `.p12` (OpenSSL 3 needs
`-macalg sha1 -certpbe PBE-SHA1-3DES -keypbe PBE-SHA1-3DES`, or `security
import` rejects it) and import it into the login keychain.
