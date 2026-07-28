import { createStore, type Content } from "tinybase/with-schemas"

export type MilestoneId = string

// Two tables, and the second one is a set. A milestone is a name, a place in
// the list, a color, and the two days that say where it sits on the timeline;
// a vacation is a day the timeline skips.
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
    // The year a milestone belongs to while it has no dates — the one that was
    // on screen when it was created. Once it has a start the dates say which
    // years it runs through and this is ignored, so it is only ever the answer
    // for a milestone that has not said when it was (see ./milestone-span).
    year: { type: "number" },
  },
  // The days taken out of the timeline. A vacation day is not a milestone's to
  // claim: the milestones still run straight through it — their dates are
  // untouched, and the no-overlap rule never sees this table — but no band is
  // painted on it, so a run reads as ending the day before and picking up again
  // the day after (see components/calendar/use-calendar-view).
  //
  // The row id *is* the day key, which is what makes marking one idempotent and
  // asking about one a lookup rather than a scan. The cell repeats the id
  // because a row with no cells is not a row as far as TinyBase is concerned.
  vacations: {
    day: { type: "string" },
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
export const INITIAL_CONTENT: Content<Schemas, true> = [
  { milestones: {}, vacations: {} },
  {},
]
