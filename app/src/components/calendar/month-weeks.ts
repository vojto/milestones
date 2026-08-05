import { dayKeyOf, weekdayIndex, WEEKDAYS, type DayKey } from "../../dates/day"

// A month laid out the way it is drawn: rows of weekdays, Monday first.
//
// The weekend has no column. What this app draws is stretches of work, and a
// milestone running from one Friday to the next Monday is one stretch rather
// than two — leaving Saturday and Sunday out is what lets its band cross the
// weekend unbroken instead of restarting every week. The days themselves are
// untouched: a milestone still starts, runs and ends on whatever day it did,
// and the timeline rule still counts every one of them.
//
// The rows run edge to edge, so the cells before the 1st and after the last day
// hold the neighbouring month's days rather than nothing — every cell is a real
// day, which is what lets the grid key its rows and cells by the day in them.
// Whether a day belongs to the month being drawn is the day cell's own
// question (see calendar-day).
//
// Always five rows, which is the most any month can need once the weekend is
// out. A month that needs fewer ends on a blank row rather than being shorter
// than its neighbours: twelve months of one height are what let the year be
// scaled to fit as a single block (see ./use-calendar-fit), and a grid of even
// rows is the steadier thing to read down anyway.
const WEEKS = 5

export function monthWeeks(year: number, month: number): DayKey[][] {
  const firstWeekday = weekdayIndex(dayKeyOf(new Date(year, month, 1, 12)))
  // A month opening on a Saturday or Sunday starts in the week after: its
  // first weekday is the Monday following, and the row that held the weekend
  // would otherwise be blank.
  const leading =
    firstWeekday < WEEKDAYS.length ? firstWeekday : firstWeekday - 7

  return Array.from({ length: WEEKS }, (_unused, week) =>
    Array.from({ length: WEEKDAYS.length }, (_alsoUnused, weekday) =>
      dayKeyOf(new Date(year, month, week * 7 + weekday + 1 - leading, 12)),
    ),
  )
}
