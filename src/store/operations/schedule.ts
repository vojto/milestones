import { addDays, type DayKey } from "../../dates/day"
import type { Db } from "../hooks"
import { claimOfMilestone, claimsOverlap } from "../milestone-span"
import type { MilestoneId } from "../schema"
import { stopPickingDate, uiState, type DateField } from "../ui-store"
import { milestoneIds } from "./milestones"
import { asUndoStep } from "./undo"

// When each milestone ran, and the one rule that governs all of it: the
// milestones are a single timeline, so no two of them may cover the same day.
//
// The rule is enforced by moving the *other* milestones rather than by
// refusing the edit. Saying "this starts today" is a statement about today,
// and the app's job is to make the rest of the timeline agree with it — which
// is nearly always what was meant anyway: starting the next thing is how the
// last thing ends. Refusing would leave the user to go and finish the previous
// milestone by hand first, for no gain.

function clearDates(db: Db, milestoneId: MilestoneId) {
  db.store.delCell("milestones", milestoneId, "startedAt")
  db.store.delCell("milestones", milestoneId, "finishedAt")
}

// Trims every other milestone out of the days `keeperId` now claims. Each
// overlap has exactly one sensible resolution, and which one it is depends
// only on how the two stretches sit against each other:
//
//   - the other one started first, so it ends the day before this one begins.
//     That is the ordinary case, and the whole of "start today" ending
//     whatever was running.
//   - the other one is wholly inside this one, so there is nothing left of it
//     to keep and it goes back to having no dates at all. It stays in the
//     list — losing a milestone because another one grew over it would be
//     destroying something the user only meant to reschedule.
//   - the other one started later and runs past this one's end, so it now
//     begins the day after.
//
// An unfinished milestone claims every day from its start onward (see
// ../milestone-span), which is why starting a second one always resolves the
// first: two things cannot both be "the one in progress".
function makeRoomFor(db: Db, keeperId: MilestoneId) {
  const keeper = claimOfMilestone(db, keeperId)
  if (keeper === undefined) {
    return
  }
  for (const otherId of milestoneIds(db)) {
    const other =
      otherId === keeperId ? undefined : claimOfMilestone(db, otherId)
    if (other === undefined || !claimsOverlap(keeper, other)) {
      continue
    }
    if (other.from < keeper.from) {
      db.store.setCell(
        "milestones",
        otherId,
        "finishedAt",
        addDays(keeper.from, -1),
      )
    } else if (
      keeper.to === undefined ||
      (other.to !== undefined && other.to <= keeper.to)
    ) {
      clearDates(db, otherId)
    } else {
      db.store.setCell(
        "milestones",
        otherId,
        "startedAt",
        addDays(keeper.to, 1),
      )
    }
  }
}

// Moving the start past an existing finish would leave a milestone that ends
// before it begins, so the finish comes along — the milestone collapses to the
// one day rather than to nothing.
export function startMilestoneOn(
  db: Db,
  milestoneId: MilestoneId,
  day: DayKey,
) {
  asUndoStep(db, "Start milestone", () => {
    const finishedAt = db.store.getCell("milestones", milestoneId, "finishedAt")
    db.store.setCell("milestones", milestoneId, "startedAt", day)
    if (finishedAt !== undefined && finishedAt < day) {
      db.store.setCell("milestones", milestoneId, "finishedAt", day)
    }
    makeRoomFor(db, milestoneId)
  })
}

// Finishing a milestone that was never started begins it the same day: a
// one-day milestone is a real thing to record, and it is the only reading of
// "this finished today" that does not throw the statement away.
export function finishMilestoneOn(
  db: Db,
  milestoneId: MilestoneId,
  day: DayKey,
) {
  asUndoStep(db, "Finish milestone", () => {
    const startedAt = db.store.getCell("milestones", milestoneId, "startedAt")
    db.store.setCell("milestones", milestoneId, "startedAt", startedAt ?? day)
    db.store.setCell(
      "milestones",
      milestoneId,
      "finishedAt",
      startedAt !== undefined && day < startedAt ? startedAt : day,
    )
    makeRoomFor(db, milestoneId)
  })
}

// Back to running, with no end in sight — which re-claims every day from its
// start onward, and so pushes aside anything that had been scheduled after it.
export function reopenMilestone(db: Db, milestoneId: MilestoneId) {
  asUndoStep(db, "Reopen milestone", () => {
    db.store.delCell("milestones", milestoneId, "finishedAt")
    makeRoomFor(db, milestoneId)
  })
}

// Back to a milestone that has not happened: it keeps its place in the list
// and its color, and gives up its stretch of the calendar.
export function clearMilestoneDates(db: Db, milestoneId: MilestoneId) {
  asUndoStep(db, "Clear dates", () => {
    clearDates(db, milestoneId)
  })
}

// Where a day chosen in the calendar lands. The pick knows which milestone and
// which of its two dates it is for, so the calendar can hand over a bare day
// and stay a calendar.
export function commitDatePick(db: Db, day: DayKey) {
  const { pickingMilestoneId, pickingField } = uiState()
  if (pickingMilestoneId === undefined || pickingField === undefined) {
    return
  }
  stopPickingDate()
  applyDate(db, pickingMilestoneId, pickingField, day)
}

function applyDate(
  db: Db,
  milestoneId: MilestoneId,
  field: DateField,
  day: DayKey,
) {
  if (field === "start") {
    startMilestoneOn(db, milestoneId, day)
  } else {
    finishMilestoneOn(db, milestoneId, day)
  }
}
