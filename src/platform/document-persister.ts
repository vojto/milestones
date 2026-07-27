import { appDataDir } from "@tauri-apps/api/path"
import {
  BaseDirectory,
  exists,
  mkdir,
  readTextFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs"
import { createCustomPersister } from "tinybase/persisters/with-schemas"
import type { Persister } from "tinybase/persisters/with-schemas"
import type { Content, Store } from "tinybase/with-schemas"
import type { Schemas } from "../store/schema"

// The document as a file on disk:
// ~/Library/Application Support/tech.median.milestones/milestones.json
//
// A file rather than webview storage, because the document is the user's — it
// can be copied, backed up and synced, and it outlives anything that clears
// the webview. The shape written is TinyBase's own [tables, values] content,
// so the file is the document and nothing else.
//
// This module and ./app-menu are the only importers of @tauri-apps/*; the rest
// of the app is plain React that knows nothing about a host. Same arrangement
// as src/dates/day.ts, which is the only module that knows what a Date is.

const DOCUMENT_FILE = "milestones.json"
const BASE_DIR = BaseDirectory.AppData

// TinyBase treats a load that throws as "nothing persisted yet" and starts
// from the initial content, which auto-save would then write straight over a
// file that may be intact but momentarily unreadable. So writing is gated on
// having read: until a load has actually come back, this persister only reads,
// and a document it could not parse stays on disk untouched.
let hasLoaded = false

async function readDocument(): Promise<Content<Schemas, true> | undefined> {
  await mkdir(await appDataDir(), { recursive: true })
  const content = (await exists(DOCUMENT_FILE, { baseDir: BASE_DIR }))
    ? (JSON.parse(
        await readTextFile(DOCUMENT_FILE, { baseDir: BASE_DIR }),
      ) as Content<Schemas, true>)
    : undefined
  hasLoaded = true
  return content
}

// Writes are serialized and coalesced. The store can change many times in a
// frame — a drag reorders on every pointer move — and two writes in flight at
// once could land in either order, leaving the older document on disk. Only
// the newest pending content is ever written, so a long gesture costs a
// handful of writes rather than one per frame.
let writing: Promise<void> | undefined
let pending: string | undefined

async function drainWrites(): Promise<void> {
  while (pending !== undefined) {
    const json = pending
    pending = undefined
    await writeTextFile(DOCUMENT_FILE, json, { baseDir: BASE_DIR })
  }
  writing = undefined
}

function writeDocument(json: string): Promise<void> {
  if (!hasLoaded) {
    return Promise.resolve()
  }
  pending = json
  writing ??= drainWrites()
  return writing
}

export function createDocumentPersister(
  store: Store<Schemas>,
): Persister<Schemas> {
  return createCustomPersister<Schemas, undefined>(
    store,
    readDocument,
    (getContent) => writeDocument(JSON.stringify(getContent())),
    // Nothing outside this app writes the file, so there is nothing to listen
    // to. Watching it would mean reacting to our own writes.
    () => undefined,
    () => undefined,
    (error: unknown) => {
      console.error("Could not persist the milestones document", error)
    },
  )
}
