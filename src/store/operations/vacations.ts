import type { DayKey } from "../../dates/day"
import type { Db } from "../hooks"
import { asUndoStep } from "./undo"

// The days taken out of the timeline. Marking one changes nothing about when a
// milestone ran — the dates in ../schema stay exactly as they were, and the
// no-overlap rule in ./schedule never reads this table — it only says the day
// does not count as part of whatever is running, which is what makes a band
// break across it and close up again on the other side.
//
// One toggle rather than a mark and a clear: a day either is a vacation day or
// is not, the menu shows whichever of the two it is not, and reading the
// current state is a rule about the day rather than something a menu should
// have to know.
export function toggleVacationDay(db: Db, day: DayKey) {
  asUndoStep(db, "Vacation day", () => {
    if (db.store.hasRow("vacations", day)) {
      db.store.delRow("vacations", day)
    } else {
      db.store.setRow("vacations", day, { day })
    }
  })
}
