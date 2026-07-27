import { createStore, type Content } from "tinybase/with-schemas"

export type MilestoneId = string

// One table. A milestone is a name, a place in the list, a color, and the two
// days that say where it sits on the timeline.
//
// `startedAt` and `finishedAt` are undefaulted on purpose, because their
// absence is the state that matters: no `startedAt` means the milestone has
// not begun and paints nothing; a `startedAt` with no `finishedAt` means it is
// still running, which is what makes it paint up to today and no further. A
// default would have had to invent a day that stands for "none", and every
// reader would then have to know it (see ./milestone-span).
export const TABLES_SCHEMA = {
  milestones: {
    name: { type: "string" },
    position: { type: "number" },
    // Color key from ui/milestone-colors.ts. Undefaulted like the dates, so
    // the schema needs no knowledge of the palette and milestoneColor()
    // resolves the absence.
    color: { type: "string" },
    startedAt: { type: "string" },
    finishedAt: { type: "string" },
  },
} as const

// The document has no values — the selection, the year on screen, the pane
// widths and the date pick in flight all live in ui-store.ts. Declaring the
// schema empty is what enforces that: TinyBase drops values the schema does
// not name, so a stray write cannot land here. A checkpoint is therefore a
// document state and nothing else, which keeps undo from rewinding the way the
// app looks.
export const VALUES_SCHEMA = {} as const

export type Schemas = [typeof TABLES_SCHEMA, typeof VALUES_SCHEMA]

export const createAppStore = () =>
  createStore().setTablesSchema(TABLES_SCHEMA).setValuesSchema(VALUES_SCHEMA)

// Used only when nothing has been persisted yet. An empty document: the list
// starts empty and the calendar starts blank, which is what an app you have
// not told anything yet should look like.
export const INITIAL_CONTENT: Content<Schemas, true> = [{ milestones: {} }, {}]
