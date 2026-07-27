import type { Table } from "tinybase/with-schemas"
import { addDays, type DayKey } from "../../dates/day"
import {
  usePickingMilestoneId,
  useSelectedMilestoneId,
} from "../../hooks/use-milestone-ui"
import { useToday } from "../../hooks/use-today"
import { useDb, useTable } from "../../store/hooks"
import { paintedRange } from "../../store/milestone-span"
import { commitDatePick } from "../../store/operations/schedule"
import type { MilestoneId, Schemas } from "../../store/schema"
import { milestoneColor, type MilestoneColor } from "../../ui/milestone-colors"

// Everything the twelve months need to know, worked out once at the top of the
// calendar and handed down as one value. The alternative — every day cell
// asking the store what covers it — would be a subscription per day and a
// thousand of them on screen; the shape of a year is one question, so it is
// asked once.

export interface DayFill {
  milestoneId: MilestoneId
  color: MilestoneColor
}

export interface CalendarView {
  // Which milestone covers each day of the year on screen. Milestones never
  // overlap (see store/operations/schedule), so one entry per day is the whole
  // answer and no day has to choose between two.
  fills: Map<DayKey, DayFill>
  today: DayKey
  // While a date is being picked the calendar stops being a chart and becomes
  // an input: `fills` is empty, so the year goes plain and every day reads as
  // something to click rather than something already spoken for.
  isPicking: boolean
  selectedMilestoneId: MilestoneId | undefined
  onPickDay: (day: DayKey) => void
}

const NO_FILLS = new Map<DayKey, DayFill>()

export function useCalendarView(year: number): CalendarView {
  const db = useDb()
  const today = useToday()
  const milestones = useTable("milestones")
  const pickingMilestoneId = usePickingMilestoneId()
  const selectedMilestoneId = useSelectedMilestoneId()
  const isPicking = pickingMilestoneId !== undefined

  return {
    fills: isPicking ? NO_FILLS : fillsForYear(milestones, year, today),
    today,
    isPicking,
    selectedMilestoneId,
    onPickDay: (day) => {
      commitDatePick(db, day)
    },
  }
}

// The days of one year that carry a color. Clipped to the year on screen, so a
// milestone running across three of them costs one year's worth of entries
// rather than three.
function fillsForYear(
  milestones: Table<Schemas[0], "milestones">,
  year: number,
  today: DayKey,
): Map<DayKey, DayFill> {
  const fills = new Map<DayKey, DayFill>()
  const firstOfYear = `${year}-01-01`
  const lastOfYear = `${year}-12-31`

  for (const [milestoneId, row] of Object.entries(milestones)) {
    const range = paintedRange(row.startedAt, row.finishedAt, today)
    if (
      range === undefined ||
      range.to < firstOfYear ||
      range.from > lastOfYear
    ) {
      continue
    }
    const color = milestoneColor(row.color)
    const last = range.to < lastOfYear ? range.to : lastOfYear
    let day = range.from > firstOfYear ? range.from : firstOfYear
    while (day <= last) {
      fills.set(day, { milestoneId, color })
      day = addDays(day, 1)
    }
  }
  return fills
}

// Where a run of one milestone's days begins and ends, which is all the day
// cell needs to round the right corners: consecutive days sit flush and read
// as one band, and only the two ends of the band are rounded.
export function runEdges(view: CalendarView, day: DayKey) {
  const milestoneId = view.fills.get(day)?.milestoneId
  return {
    isRunStart: view.fills.get(addDays(day, -1))?.milestoneId !== milestoneId,
    isRunEnd: view.fills.get(addDays(day, 1))?.milestoneId !== milestoneId,
  }
}
