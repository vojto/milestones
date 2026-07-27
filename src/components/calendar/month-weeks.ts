import { dayKeyOf, weekdayIndex, type DayKey } from "../../dates/day"

// A month laid out the way it is drawn: whole rows of seven, Monday first.
// The rows run edge to edge, so the cells before the 1st and after the last day
// hold the neighbouring month's days rather than nothing — every cell is a real
// day, which is what lets the grid key its rows and cells by the day in them.
// Whether a day belongs to the month being drawn is the day cell's own
// question (see calendar-day).
export function monthWeeks(year: number, month: number): DayKey[][] {
  const firstDay = dayKeyOf(new Date(year, month, 1, 12))
  // Day 0 of the next month is the last day of this one.
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
  const leading = weekdayIndex(firstDay)
  const weekCount = Math.ceil((leading + lastDayOfMonth) / 7)

  return Array.from({ length: weekCount }, (_unused, week) =>
    Array.from({ length: 7 }, (_alsoUnused, weekday) =>
      dayKeyOf(new Date(year, month, week * 7 + weekday + 1 - leading, 12)),
    ),
  )
}
