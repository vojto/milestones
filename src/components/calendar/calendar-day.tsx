import {
  dayOfMonth,
  formatDay,
  monthOf,
  weekdayIndex,
  WEEKDAYS,
  type DayKey,
} from "../../dates/day"
import { runEdges, type CalendarView, type DayFill } from "./use-calendar-view"

// Both modes lay the cell out the same way, so entering a date pick does not
// move a single number.
const CELL_CLASS =
  "relative flex h-6 items-center justify-center text-[11px] tabular-nums"

// One day of a month. Two layers: the milestone's band, which spans the whole
// cell so consecutive days join into a continuous bar, and the number on top
// of it, which never moves whether the day is colored or not.
export default function CalendarDay({
  day,
  month,
  view,
}: {
  day: DayKey
  month: number
  view: CalendarView
}) {
  // The grid runs in whole weeks, so the corners of it belong to the months on
  // either side. They are left blank rather than drawn faintly: this pane shows
  // twelve months at once, and every one of those days is already a cell of its
  // own a few centimetres away.
  if (monthOf(day) !== month) {
    return <td />
  }

  const fill = view.fills.get(day)
  const isVacation = view.vacationDays.has(day)
  // With a milestone selected, the rest of the year steps back so its own
  // stretch reads at a glance. Nothing is hidden — a faded band is still a
  // band — and with nothing selected the whole year is at full strength.
  const isDimmed =
    fill !== undefined &&
    view.selectedMilestoneId !== undefined &&
    view.selectedMilestoneId !== fill.milestoneId

  const numberClass = dayNumberClass({
    fill,
    isDimmed,
    isToday: day === view.today,
    isVacation,
  })

  return (
    // data-day is how a right-click finds which day it landed on: the calendar
    // has one context menu for the whole year rather than one per cell (see
    // ./year-calendar). Only the days of the month being drawn carry it, so
    // right-clicking a blank corner offers nothing.
    <td className="relative p-0" data-day={day}>
      {fill !== undefined && (
        <DayBand day={day} fill={fill} isDimmed={isDimmed} view={view} />
      )}
      {view.isPicking ? (
        <button
          aria-label={formatDay(day)}
          className={`${CELL_CLASS} w-full rounded-md transition-colors hover:bg-neutral-200`}
          onClick={() => {
            view.onPickDay(day)
          }}
          type="button"
        >
          <span className={numberClass}>{dayOfMonth(day)}</span>
        </button>
      ) : (
        <div className={CELL_CLASS}>
          <span className={numberClass}>{dayOfMonth(day)}</span>
        </div>
      )}
    </td>
  )
}

// How the number is inked, which is three answers layered on one span:
//
//   - whose day it is: the band's own text color, or grey where no band
//     reaches — including a dimmed one, whose number steps back with it.
//   - whether it is a day off: struck through, in an ink darker than a plain
//     day's, because a day crossed out is a statement rather than an absence.
//   - whether it is today: circled rather than filled in, and in the number's
//     own color, so on a colored day the circle takes the band's ink and
//     marking today never fights the milestone underneath it. The heavier
//     weight is what carries at a glance.
function dayNumberClass({
  fill,
  isDimmed,
  isToday,
  isVacation,
}: {
  fill: DayFill | undefined
  isDimmed: boolean
  isToday: boolean
  isVacation: boolean
}): string {
  const inkClass = isVacation
    ? "text-neutral-600 line-through"
    : fill === undefined || isDimmed
      ? "text-neutral-500"
      : fill.color.dayTextClass

  return isToday
    ? `flex size-5 items-center justify-center rounded-full font-medium ring-1 ring-current ${inkClass}`
    : inkClass
}

// The colored band behind the number, drawn as its own layer so dimming it
// leaves today's marker at full contrast. Rounded only where the run of days
// actually ends — and at Monday and Friday, where the band wraps to the next
// row and a square corner would look like it had been cut off. A run that
// merely crosses a weekend is not an end: Friday's neighbour is Saturday,
// which is filled like any other day even though it has no column.
function DayBand({
  day,
  fill,
  isDimmed,
  view,
}: {
  day: DayKey
  fill: DayFill
  isDimmed: boolean
  view: CalendarView
}) {
  const { isRunStart, isRunEnd } = runEdges(view, day)
  const weekday = weekdayIndex(day)
  const roundLeft = isRunStart || weekday === 0 ? "rounded-l-md" : ""
  const roundRight =
    isRunEnd || weekday === WEEKDAYS.length - 1 ? "rounded-r-md" : ""

  return (
    <span
      aria-hidden="true"
      className={`absolute inset-0 ${fill.color.dayClass} ${roundLeft} ${roundRight} ${
        isDimmed ? "opacity-25" : ""
      }`}
    />
  )
}
