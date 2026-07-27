import {
  formatDay,
  monthOf,
  weekdayIndex,
  WEEKDAYS,
  type DayKey,
} from "../../dates/day"
import { runEdges, type CalendarView, type DayFill } from "./use-calendar-view"

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
  const isToday = day === view.today
  // With a milestone selected, the rest of the year steps back so its own
  // stretch reads at a glance. Nothing is hidden — a faded band is still a
  // band — and with nothing selected the whole year is at full strength.
  const isDimmed =
    fill !== undefined &&
    view.selectedMilestoneId !== undefined &&
    view.selectedMilestoneId !== fill.milestoneId

  const dayOfMonth = Number(day.slice(-2))
  const textClass =
    fill === undefined || isDimmed
      ? "text-neutral-500"
      : fill.color.dayTextClass
  // Today is circled rather than filled in, and the circle is drawn in the
  // number's own color: on a plain day it is a grey outline, and on a colored
  // one it takes the band's ink, so marking today never fights the milestone
  // underneath it. The heavier weight is what carries at a glance.
  const numberClass = isToday
    ? `flex size-5 items-center justify-center rounded-full font-medium ring-1 ring-current ${textClass}`
    : textClass

  return (
    <td className="relative p-0">
      {fill !== undefined && (
        <DayBand day={day} fill={fill} isDimmed={isDimmed} view={view} />
      )}
      {view.isPicking ? (
        <button
          aria-label={formatDay(day)}
          className="relative flex h-6 w-full items-center justify-center rounded-md text-[11px] tabular-nums transition-colors hover:bg-neutral-200"
          onClick={() => {
            view.onPickDay(day)
          }}
          type="button"
        >
          <span className={numberClass}>{dayOfMonth}</span>
        </button>
      ) : (
        <div className="relative flex h-6 items-center justify-center text-[11px] tabular-nums">
          <span className={numberClass}>{dayOfMonth}</span>
        </div>
      )}
    </td>
  )
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
