import MonthCalendar from "./month-calendar"
import { useCalendarView } from "./use-calendar-view"

const MONTHS = Array.from({ length: 12 }, (_unused, month) => month)

// The whole year at once, which is the point of the pane: a milestone is
// something you want to see the shape of against everything else that
// happened, and twelve small months side by side is the only layout that shows
// a year without scrolling through it.
export default function YearCalendar({ year }: { year: number }) {
  const view = useCalendarView(year)

  return (
    <div className="@container min-h-0 flex-1 overflow-y-auto px-6 pb-8">
      {/* Column counts that divide twelve, so the year always comes out as
          full rows of months rather than a ragged last row. They answer to the
          pane's width, not the window's — the separator between the panes is
          draggable, and the year has to reflow when it moves. */}
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 @lg:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4">
        {MONTHS.map((month) => (
          <MonthCalendar key={month} month={month} view={view} year={year} />
        ))}
      </div>
    </div>
  )
}
