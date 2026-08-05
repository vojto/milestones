# Agent Instructions

Run all commands and resolve all paths in this document from the `app/` directory.

## About this project

A local-first desktop app for tracking milestones ("milestones"): a year
calendar on the left, a sortable list of milestones on the right. Each
milestone owns a color and a stretch of days, and those days are painted into
the calendar. Tauri v2 for the desktop shell, React 19 + Vite + TypeScript
(strict, `noUncheckedIndexedAccess`) + Tailwind v4, TinyBase v9 for the
document, Zustand for UI state, `@dnd-kit/react` for drag and drop. Menus are
the host's, not a component library's. No router.

There is no browser build. The app assumes a window, a menu bar and a
filesystem, and `npm run dev` on its own will fail at the first thing it asks
of the host.

Conventions follow the sibling `focuslist` checkout; keep the two in step
when you change something structural. The Tauri shell is the deliberate
exception — `focuslist` has none.

## Programming preferences

Apply the "uberskill" in `~/.agents/skills/uberskill` for every coding task
(implementing, changing, reviewing, or refactoring). Read its `SKILL.md`,
then the relevant references — always `references/general-programming.md`,
plus `references/typescript-react.md` for the work in this repo. It governs
code structure, helper extraction, naming, change scope, and verification.

## Workflow

- The user tests changes in the running app themselves. Leave the app running
  (`npm run tauri dev`, which starts Vite for you) and hand off; don't drive
  the app with Playwright unprompted.
- Verify the frontend with
  `npm run build && npm run lint && npx prettier --check .`, and the shell
  with `cargo fmt --check && cargo clippy` in `src-tauri/`. All must pass
  clean before committing. Don't pipe those through `tail`; it swallows the
  exit code.
- **Finish every feature by staging it**: once the verification above passes,
  run `npm run stage`. It builds the release `.app`, quits whatever copy is
  running, replaces `/Applications/Milestones.app` and launches it. The
  staging copy reads the same document as the dev build — the identifier
  decides that — so the user lives with the change in a real window rather
  than a `tauri dev` one. `scripts/install-local.sh` is the script itself.
- **Then commit and push**, without being asked: `git add -A`, one commit
  describing the feature, and `git push` to `origin main`. Work lands on
  `main` — this is a single-author app with no review step, and a branch that
  is never opened as a pull request is just an unpushed commit. So the order
  at the end of every feature is: verify, stage, commit, push.

## The Mac App Store

The app ships on the Mac App Store. **Use the `/release` skill in
`.claude/skills/release` for anything to do with releasing** — it holds the
identifiers, the certificates and the order of operations. What is worth
knowing here is how that build differs from the one you develop against:

- **It is sandboxed, and the local build is not.** `npm run stage` writes to
  `~/Library/Application Support/tech.median.milestones`; the store copy writes
  to the same path inside its own container. Nothing in `src/` knows the
  difference — `appDataDir()` answers with wherever the app is allowed to
  write — but the two do not share a document, so a change tested in one is
  not visible in the other.
- **`src-tauri/entitlements.mas.plist` is the sandbox.** It grants the least
  it can, and every line in it is there because the app does not work without
  it. Read the comment before adding or removing anything.
- **Verifying the sandbox.** The store build cannot be launched by hand: a
  distribution signature is killed on launch outside the store. Copy the built
  `.app`, drop its `embedded.provisionprofile`, re-sign the copy with
  `Developer ID Application` and the same entitlements, and run that. Anything
  the sandbox denies fails there too.
- **`scripts/build-mas.sh` owns signing, not Tauri.** The provisioning profile
  has to be inside the bundle before the signature is taken and Tauri has no
  step there, so it bundles unsigned and the script does the rest.
- **The listing is in `metadata/`**, in the canonical `asc` layout, and is
  edited like code rather than in a browser.

## The icon

`src-tauri/app-icon.png` is the source: 1024×1024, the artwork inset to
824×824 and masked to a squircle, which is the macOS grid. `npm run tauri
icon src-tauri/app-icon.png` regenerates everything in `src-tauri/icons/`
from it — then delete the `android/` and `ios/` folders it also writes, since
this app is macOS only and `tauri.conf.json` doesn't reference them.

## The desktop shell (Tauri v2)

`src-tauri/` is the window; everything the app actually does is in `src/`.
`lib.rs` registers the fs plugin and runs the builder, and that is all the
Rust there is. Resist growing it: a `#[tauri::command]` is a new boundary to
keep in sync, and so far nothing has needed one.

- **`src/platform/` is the only place that may import `@tauri-apps/*`.** Same
  arrangement as `src/dates/day.ts` and its `Date` objects: the rest of the
  app is plain React that knows nothing about a host, and one module does the
  translating. A `@tauri-apps` import appearing anywhere else is the thing to
  fix, not to follow.
- **The document is a file**, `milestones.json` in the app data directory,
  written by the custom TinyBase persister in
  `platform/document-persister.ts`. It writes TinyBase's own
  `[tables, values]` content, so the file _is_ the document and can be copied
  or backed up as one. Writes are serialized and coalesced — a drag changes
  the store on every pointer move — and nothing is written until a load has
  come back, so a document that could not be read is never overwritten by an
  empty one.
- **The menu bar is built in JavaScript** (`platform/app-menu.ts`), not in
  Rust, because whether Undo is available is a question about TinyBase
  checkpoints and those live in the webview. Its items call the same
  `store/operations` functions as everything else.
- **Context menus are native too** (`platform/context-menu.ts`). Anything with
  a menu describes it as a `ContextMenuItem[]` — a plain function, not a
  component, built at right-click time so it reads the milestone as it is now
  — and hands it to `contextMenuHandler`, the single `onContextMenu` handler
  that builds the host menu, pops it and claims the event. Add a menu by
  writing a description, never by drawing one.
- **Commands with a modifier belong to the menu; bare keys belong to
  `keyboard/use-keyboard.ts`.** ⌘Z and ⌘N are menu accelerators, and the
  keymap returns early on any modifier so one keystroke cannot fire twice.
  Bare Delete and the arrows stay in the keymap: as accelerators they would
  fire while you are typing a name. Undo and Redo grey out while a rename is
  in flight so the keystroke falls through to the text field's own undo.
- **Permissions are least-privilege and stay that way.**
  `src-tauri/capabilities/default.json` grants four fs commands over
  `$APPDATA` and nothing else. Anything new the app needs is a deliberate
  line there, never a wildcard.

## React Compiler is enabled

`babel-plugin-react-compiler` memoizes components and values at build time,
which changes how to write React here:

- **Do not** use `useCallback`, `useMemo`, or `React.memo`. Write plain
  functions and plain values; manual memoization in a diff is almost
  certainly wrong for this codebase. (Narrow exception: a `useCallback` whose
  identity gates a ref callback, as in `ui/inline-edit-input.tsx`.)
- Follow the Rules of React in return. No mutating props/state, no side
  effects during render, hooks only at the top level.
  `eslint-plugin-react-hooks` includes the compiler's lint rules — fix what
  it flags rather than working around it. A flagged component is silently
  skipped by the compiler.
- A function that calls no hooks is not a hook: don't give it a `use` prefix.

## Data layer (TinyBase for the document, Zustand for the UI)

- All mutations live in `src/store/operations/`; components never write cells
  directly. The layer holds rules, not just writes — what a piece of state
  _means_ belongs there too, so a menu and the keyboard get the same answer.
- Every user action seals exactly one undo step via `asUndoStep`. Building
  blocks a gesture calls repeatedly leave sealing to the gesture. Never seal
  on the way _into_ an action: a checkpoint taken before changing anything
  undoes nothing, which reads as a dead keypress. `operations/undo.ts` is the
  only module that touches checkpoints.
- Ordering uses fractional positions (midpoint inserts, no renumbering), read
  back through `getSortedRowIds`/`useSortedRowIds` — there is one list, so
  the app needs no Indexes object.
- Hooks come from `src/store/hooks.ts`, the single schema-typed cast of
  `tinybase/ui-react/with-schemas`. TinyBase's row/cell _writing_ hooks are
  deliberately not re-exported there — a component has nothing to reach for
  but the operations.
- Keep the document to tables. The values schema is empty on purpose, so a
  checkpoint is document state and nothing else and undo cannot rewind the
  way the app looks.
- UI state that only one component needs (an edit draft) is plain React
  state. Everything else about how the app looks lives in
  `src/store/ui-store.ts` — including anything a second component could need
  to open, close, or address. Components read it through the named hooks in
  `src/hooks/use-milestone-ui.ts`; the operations layer reads it outside
  React through `uiState()`. Selectors must return primitives, never fresh
  objects.
- Session state (selection, rename in flight, the year on screen, the date
  pick) is simply not persisted; only chrome goes in `partialize`. Every id
  resolves against the document, so a stale one is inert and needs no
  cleanup.
- Verify TinyBase APIs against `node_modules/tinybase/agents.md` and
  `node_modules/tinybase/@types/` — do not trust training data.

## The timeline rule

The milestones are one timeline: **no two of them may cover the same day.**
It is enforced in `store/operations/schedule.ts` by moving the _other_
milestones out of the way, never by refusing the edit — starting the next
thing is how the last thing ends. An unfinished milestone claims every day
from its start onward, which is what makes that work; see
`store/milestone-span.ts` for the difference between the days a milestone
_claims_ (for the rule) and the days it _paints_ (stops at today).

If you add a new way to set dates, route it through `startMilestoneOn` /
`finishMilestoneOn` so it cannot bypass the rule.

## Dates

Days are `"YYYY-MM-DD"` strings, never `Date` objects, everywhere but inside
`src/dates/day.ts`. They compare chronologically with `<` and `>`, they
survive a timezone change, and they are the same string in the store as on
screen. Anything that needs a `Date` — arithmetic, `Intl` formatting —
belongs in that module.

Rendering reads today from `useToday()`, which rechecks so a window left open
overnight does not go stale; an action reads `todayKey()` directly, because a
click is its own moment.

## Drag and drop (@dnd-kit/react)

`@dnd-kit/react` + `@dnd-kit/helpers`, exact-pinned at 0.5.0 — a fast-moving
0.x rewrite. The installed type declarations are the source of truth, not
docs or memory.

- Placement rules must depend only on the dragged card's rectangle, never on
  the row's current index, so repeated commits can't oscillate.
- Never `preventDefault()` a dragmove — it freezes the drag.
- Style the dragging and placeholder states with Tailwind data variants
  (`data-[dnd-dragging]`, `data-[dnd-placeholder]`) on the row element.
  React-conditional classes won't work: attribute changes are mirrored onto
  the clone.

## Other conventions

- **Prettier, no semicolons** — `.prettierrc` sets `semi: false`. Run
  `npm run format` after edits.
- **Strict, type-aware linting** — typescript-eslint `strictTypeChecked` +
  `stylisticTypeChecked`, plus `@eslint-react` and `jsx-a11y`:
  - No non-null assertions (`!`); narrow with a check or throw.
  - Interactive elements need accessible names and keyboard handling
    (jsx-a11y is strict about roles: e.g. an `li` may be `role="option"`,
    not `role="button"`).
  - No array indexes as keys. The month grid runs in whole weeks precisely so
    every cell has a real day to key on.
- **No focus rings anywhere** (see `src/index.css`). Selection is what the
  app draws; where the keyboard is takes the same grey a hover does.
- **Components** are grouped by feature under `src/components/`
  (`calendar/`, `milestone-list/`, `panes/`). Default exports, kebab-case
  filenames. Generic presentational primitives live in `src/ui/`.
- **Domain hooks are co-located with their component.** A hook specific to
  one component lives in that component's feature folder; only generic hooks
  with no ties to a single component belong in `src/hooks/`.
- **Creation is inline, never a dialog.** "New milestone" creates an unnamed
  row right away and opens its inline editor, by setting the edit value in
  the same transaction as the insert. Double-click starts a rename.
- **Anything absent resolves to something drawable, in one place.** A name
  goes through `displayName()` (`ui/display-name.ts`), a color through
  `milestoneColor()` (`ui/milestone-colors.ts`), so an unnamed row or an
  unrecognized color key looks the same everywhere and no caller re-derives
  the fallback.
- **Tailwind class names are written out in full.** Tailwind finds classes by
  scanning source text, so a class assembled at runtime (`bg-${hue}-300`)
  produces no CSS. That is why `ui/milestone-colors.ts` spells every one out.
