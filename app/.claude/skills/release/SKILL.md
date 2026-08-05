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
| App ID            | `6795149910`                                              |

`upload-mas.sh` resolves the app ID from the bundle ID rather than holding the
number, and you can too:

```bash
asc --profile Median apps list --bundle-id tech.median.milestones --output table
```

**`asc` defaults to `--platform IOS` nearly everywhere.** Any command that
takes the flag needs `--platform MAC_OS`, and the ones that do not take it
(`screenshots upload`) need to be addressed by resource ID instead. An
"app store version not found for platform IOS" error always means this.

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

A version that already exists — the previous one before it has shipped, or a
`DEVELOPER_REJECTED` one — cannot be joined by a second. Rename it instead:

```bash
asc --profile Median versions update --version-id VERSION_ID --version "1.0.0" \
  --copyright "2026 Median Tech, s.r.o."
```

Keep the version string equal to `CFBundleShortVersionString` in the build.

### 5. Apply metadata

The listing lives in `metadata/` in canonical `asc` form: `app-info/en-US.json`
is the name, subtitle and privacy policy URL; `version/<version>/en-US.json` is
the description, keywords and support URL. Copy the version directory when you
start a new version, and write `whatsNew` in the new one.

`apply` will not act on a plan nobody looked at, so it goes plan, approve,
apply. The `.asc/` directory those write into is scratch, and is ignored.

```bash
asc --profile Median metadata validate --dir ./metadata
asc --profile Median metadata plan --app APP_ID --version "1.0.0" --dir ./metadata
asc --profile Median metadata approve --review-dir .asc/metadata/review --all
asc --profile Median metadata apply --app APP_ID --version "1.0.0" --dir ./metadata \
  --review-dir .asc/metadata/review --confirm
```

`apply` prints the version localization ID it wrote to. Keep it — the
screenshot step needs it.

`metadata/privacy.json` is the app privacy declaration — "collects nothing",
which is the whole truth and needs no maintenance. It is already published;
only re-apply it if that ever stops being true. It needs a web session
(`asc web auth login --apple-id median@rinik.net`, run in a real terminal —
the password prompt needs a TTY):

```bash
asc web privacy apply --app APP_ID --file ./metadata/privacy.json
asc web privacy publish --app APP_ID --confirm
```

Note that `asc web privacy pull` reports `DATA_NOT_COLLECTED` even when
nothing has been declared yet; `plan` is what tells you the truth.

### 6. Screenshots

Only needed when the interface has changed — Apple keeps the previous set
otherwise.

They live under a locale directory —
`metadata/screenshots/APP_DESKTOP/en-US/`. `screenshots upload` has no
`--platform` flag and would go looking for an iOS version, so address the
localization directly with the ID step 5 printed:

```bash
asc --profile Median screenshots validate \
  --path ./metadata/screenshots/APP_DESKTOP/en-US --device-type APP_DESKTOP
asc --profile Median screenshots upload \
  --version-localization VERSION_LOCALIZATION_ID \
  --path ./metadata/screenshots/APP_DESKTOP/en-US --device-type APP_DESKTOP
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

Ask first what is still missing, rather than finding out from a failed
submission:

```bash
asc --profile Median validate --app APP_ID --version "1.0.0" --output table
```

The review contact details are per version and are not copied forward, so
every version needs them again:

```bash
asc --profile Median review details-create --version-id VERSION_ID \
  --contact-first-name "Vojtech" --contact-last-name "Rinik" \
  --contact-phone "+421901712101" --contact-email "vojto@rinik.net" \
  --demo-account-required=false \
  --notes "…what a reviewer should do with a window that has no account…"
```

`validate` will keep reporting App Privacy as unverifiable — the public API
cannot read its publish state. That one is noise, not a blocker.

```bash
ASC_TIMEOUT=180s asc --profile Median review submit \
  --app APP_ID --version-id VERSION_ID --platform MAC_OS --build BUILD_ID --confirm
```

Then confirm it landed:

```bash
asc --profile Median versions list --app APP_ID --output table
```

Expected end state: `WAITING_FOR_REVIEW`.

## Settled once, in July 2026

These are properties of the app rather than of a release, and none of them
needs doing again. They are written down because nothing in the repository
records them, and because the next person to wonder "where is the category
set?" should not have to go looking.

```bash
asc --profile Median app-setup categories set --app APP_ID --primary PRODUCTIVITY
asc --profile Median apps content-rights edit --app APP_ID --uses-third-party-content=false
asc --profile Median age-rating edit --app APP_ID --all-none          # 4+
asc --profile Median app-setup pricing set --app APP_ID --free
```

Availability had to be created before it could be edited, and wants every
territory named — `--all-territories` only works on an app that already has
an availability record:

```bash
TERRS=$(asc --profile Median pricing territories list --output json --paginate |
  python3 -c "import sys,json; print(','.join(t['id'] for t in json.load(sys.stdin)['data']))")
asc --profile Median pricing availability create --app APP_ID \
  --available true --available-in-new-territories true --territory "$TERRS"
```

The app record itself was made with `asc web apps create`, which needs a web
session rather than the API key. It creates a version named after `--version`
truncated to two components, which is why 1.0.0 arrived as `1.0` and had to be
renamed.

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
