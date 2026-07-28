import type { Row } from "tinybase/with-schemas"
import {
  firstDayOfYear,
  lastDayOfYear,
  laterDay,
  yearOf,
  type DayKey,
} from "../dates/day"
import type { Db } from "./hooks"
import type { MilestoneId, Schemas } from "./schema"

export type Milestone = Row<Schemas[0], "milestones">

// What a milestone's two dates mean as a stretch of time. Two questions get
// asked of them and they are not the same question, so each gets its own
// function here rather than being re-derived by every caller.
//
// The *claim* is what the no-overlap rule works on (see operations/schedule):
// a milestone that has started and not finished claims every day from its
// start onward, forever. That is what makes starting a second milestone end
// the first one instead of running alongside it.
//
// The *painted* range is what the calendar fills in, and it stops at today: a
// milestone still running has no idea how long it will run, so coloring
// tomorrow would be a claim about the future the user never made. A milestone
// with a finish date does not stop at today — that date was typed in on
// purpose, and a plan laid out ahead of time is worth seeing.

// A closed stretch of days, both ends included.
export interface DayRange {
  from: DayKey
  to: DayKey
}

// A stretch with an open end: `to` undefined means "and onward, indefinitely".
export interface Claim {
  from: DayKey
  to: DayKey | undefined
}

export function claimOf(
  startedAt: string | undefined,
  finishedAt: string | undefined,
): Claim | undefined {
  if (startedAt === undefined) {
    return undefined
  }
  // A finish before the start would claim nothing at all; the scheduling
  // operations never write one, and reading it as a single day keeps a
  // damaged document drawable rather than invisible.
  return {
    from: startedAt,
    to: finishedAt === undefined ? undefined : laterDay(finishedAt, startedAt),
  }
}

// The same question asked of the document, for the operations layer — which
// reads rows by id rather than through a hook.
export function claimOfMilestone(
  db: Db,
  milestoneId: MilestoneId,
): Claim | undefined {
  return claimOf(
    db.store.getCell("milestones", milestoneId, "startedAt"),
    db.store.getCell("milestones", milestoneId, "finishedAt"),
  )
}

export function claimsOverlap(one: Claim, other: Claim): boolean {
  return (
    (one.to === undefined || other.from <= one.to) &&
    (other.to === undefined || one.from <= other.to)
  )
}

// Whether a milestone belongs in a given year's list. The list shows one year
// at a time, the same year the calendar is showing, so this is the question of
// which milestones that is.
//
// A milestone belongs to every year its stretch runs through, and a running
// one reaches no further than today — it has not happened next year yet. A
// milestone with no dates yet belongs to the year it was created in — the year
// that was on screen at the time — so one you have just made stays in front of
// you instead of turning up in every other year as well. One written before
// that year was recorded falls back to this year, which is where it would have
// been made.
export function runsThroughYear(
  milestone: Milestone,
  today: DayKey,
  year: number,
): boolean {
  const claim = claimOf(milestone.startedAt, milestone.finishedAt)
  if (claim === undefined) {
    return (milestone.year ?? yearOf(today)) === year
  }
  // An open end reaches today, or its own start if that is still ahead — a
  // milestone starting next year is in next year, not in every year between.
  const to = claim.to ?? laterDay(today, claim.from)
  return claim.from <= lastDayOfYear(year) && to >= firstDayOfYear(year)
}

// The days that actually get the milestone's color. Undefined when there is
// nothing to paint: the milestone has not started, or it is still running and
// its start is in the future, so its whole life so far is zero days long.
export function paintedRange(
  startedAt: string | undefined,
  finishedAt: string | undefined,
  today: DayKey,
): DayRange | undefined {
  const claim = claimOf(startedAt, finishedAt)
  if (claim === undefined) {
    return undefined
  }
  const to = claim.to ?? today
  return to < claim.from ? undefined : { from: claim.from, to }
}
