import { useState } from "react"
import type { DayKey } from "../../dates/day"
import { closestElement } from "../../ui/closest-element"
import { ContextMenu, ContextMenuItem } from "../../ui/context-menu"
import MonthCalendar from "./month-calendar"
import { GAP_X, GAP_Y, MONTH_WIDTH, useCalendarFit } from "./use-calendar-fit"
import { useCalendarView } from "./use-calendar-view"

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
  // One menu for the whole year rather than one per day. A menu is a floating
  // state machine of its own, and three hundred of them sitting behind three
  // hundred numbers would be rebuilt every time anything about the year
  // changed — so the grid holds the only one and the right-click says which
  // day it is for. A right-click that missed the days finds none, which is
  // what keeps the menu from opening over the gaps between months.
  const [menuDay, setMenuDay] = useState<DayKey | undefined>(undefined)

  return (
    <div ref={containerRef} className="relative min-h-0 flex-1 overflow-hidden">
      <ContextMenu
        isOpen={menuDay !== undefined}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setMenuDay(undefined)
          }
        }}
        trigger={
          <div
            ref={gridRef}
            className="absolute left-1/2 top-1/2 grid"
            onContextMenu={(event) => {
              setMenuDay(dayAt(event.target))
            }}
            style={{
              columnGap: GAP_X,
              gridTemplateColumns: `repeat(${columns}, ${MONTH_WIDTH}px)`,
              rowGap: GAP_Y,
              transform: `translate(-50%, -50%) scale(${scale})`,
            }}
          >
            {MONTHS.map((month) => (
              <MonthCalendar
                key={month}
                month={month}
                view={view}
                year={year}
              />
            ))}
          </div>
        }
      >
        {menuDay !== undefined && (
          <ContextMenuItem
            onClick={() => {
              view.onToggleVacationDay(menuDay)
            }}
          >
            {view.vacationDays.has(menuDay)
              ? "Clear vacation day"
              : "Mark as vacation day"}
          </ContextMenuItem>
        )}
      </ContextMenu>
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
