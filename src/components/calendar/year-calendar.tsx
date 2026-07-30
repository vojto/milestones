import type { DayKey } from "../../dates/day"
import {
  contextMenuHandler,
  type ContextMenuDescription,
} from "../../platform/context-menu"
import { closestElement } from "../../ui/closest-element"
import MonthCalendar from "./month-calendar"
import { GAP_X, GAP_Y, MONTH_WIDTH, useCalendarFit } from "./use-calendar-fit"
import { useCalendarView, type CalendarView } from "./use-calendar-view"

const MONTHS = Array.from({ length: 12 }, (_unused, month) => month)

// The whole year at once, which is the point of the pane: a milestone is
// something you want to see the shape of against everything else that
// happened, and twelve small months side by side is the only layout that shows
// a year without scrolling through it.
//
// So it never scrolls. The months are laid out at one natural size and the
// grid is scaled into whatever room the pane has, which is also what picks the
// number of columns (see ./use-calendar-fit). The grid is taken out of the
// flow and centred, because a scaled element still occupies its unscaled size
// in layout and would otherwise push the pane around.
export default function YearCalendar({ year }: { year: number }) {
  const view = useCalendarView(year)
  const { columns, containerRef, gridRef, scale } = useCalendarFit()

  return (
    <div ref={containerRef} className="relative min-h-0 flex-1 overflow-hidden">
      {/* One handler for the whole year rather than one per day: three hundred
          of them behind three hundred numbers would be rebuilt every time
          anything about the year changed, so the grid catches the right-click
          and works out which day it was for. */}
      <div
        ref={gridRef}
        className="absolute left-1/2 top-1/2 grid"
        onContextMenu={contextMenuHandler((event) =>
          vacationMenu(view, dayAt(event.target)),
        )}
        style={{
          columnGap: GAP_X,
          gridTemplateColumns: `repeat(${columns}, ${MONTH_WIDTH}px)`,
          rowGap: GAP_Y,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        {MONTHS.map((month) => (
          <MonthCalendar key={month} month={month} view={view} year={year} />
        ))}
      </div>
    </div>
  )
}

// Which day was right-clicked, read from the cell the pointer was over (see
// ./calendar-day). Undefined for anything else inside the grid — a month
// heading, a weekday letter, the space between two months.
function dayAt(target: EventTarget): DayKey | undefined {
  return (
    closestElement(target, "[data-day]")?.getAttribute("data-day") ?? undefined
  )
}

// The one thing a day can be told to do. A right-click that found no day
// describes nothing, which is what keeps a menu from opening over the gaps
// between months.
function vacationMenu(
  view: CalendarView,
  day: DayKey | undefined,
): ContextMenuDescription {
  return [
    day !== undefined && {
      label: view.vacationDays.has(day)
        ? "Clear vacation day"
        : "Mark as vacation day",
      run: () => {
        view.onToggleVacationDay(day)
      },
    },
  ]
}
