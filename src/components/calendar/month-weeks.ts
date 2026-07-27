import { dayKeyOf, weekdayIndex, type DayKey } from "../../dates/day"

// A month laid out the way it is drawn: whole rows of seven, Monday first.
// The rows run edge to edge, so the cells before the 1st and after the last day
// hold the neighbouring month's days rather than nothing — every cell is a real
// day, which is what lets the grid key its rows and cells by the day in them.
// Whether a day belongs to the month being drawn is the day cell's own
// question (see calendar-day).
//
// Always six rows, which is the most any month can need. A month that needs
// fewer ends on a blank row rather than being shorter than its neighbours:
// twelve months of one height are what let the year be scaled to fit as a
// single block (see ./use-calendar-fit), and a grid of even rows is the
// steadier thing to read down anyway.
const WEEKS = 6

export function monthWeeks(year: number, month: number): DayKey[][] {
  const leading = weekdayIndex(dayKeyOf(new Date(year, month, 1, 12)))

  return Array.from({ length: WEEKS }, (_unused, week) =>
    Array.from({ length: 7 }, (_alsoUnused, weekday) =>
      dayKeyOf(new Date(year, month, week * 7 + weekday + 1 - leading, 12)),
    ),
  )
}
