import { X } from "lucide-react"
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

// One day of a month, in layers: the milestone's band, which spans the whole
// cell so consecutive days join into a continuous bar; the number on top of
// it, which never moves whether the day is colored or not; and on a day off,
// the cross over the number.
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

  // The number and, on a day off, the cross over it. Built once and used in
  // both modes below, which is what keeps the two from drifting apart.
  const face = (
    <>
      <span
        className={dayNumberClass({
          fill,
          isDimmed,
          isToday: day === view.today,
          isVacation,
        })}
      >
        {dayOfMonth(day)}
      </span>
      {isVacation && <DayCross />}
    </>
  )

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
          {face}
        </button>
      ) : (
        <div className={CELL_CLASS}>{face}</div>
      )}
    </td>
  )
}

// The cross over a day off. Red, which is the one thing in the calendar that
// is: nothing else here is a mark on a day, so it reads as struck out at a
// glance rather than as one more milestone color. The number behind it only
// steps back a little — enough to sit behind the cross, not so far that you
// have to look for the date.
//
// Centred by its own margins against the cell rather than by the cell's
// flexbox, which puts it on the same centre the number is laid out around.
// Sized to cross the number rather than to sit inside it: the icon's stroke
// spans 7/12 of its box, so 18px draws a cross about 10.5px across, against
// the 12.3px a two-digit day is wide.
function DayCross() {
  return (
    <X
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 m-auto size-4.5 text-red-500"
    />
  )
}

// How the number is inked, which is three answers layered on one span:
//
//   - whose day it is: the band's own text color, or grey where no band
//     reaches — including a dimmed one, whose number steps back with it.
//   - whether it is a day off: stepped back a little, so the red cross laid
//     over it (see ./DayCross) is what the cell says first.
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
    ? "text-neutral-500 opacity-75"
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
