import { ChevronLeft, ChevronRight } from "lucide-react"
import { yearOf } from "../../dates/day"
import { useShownYear } from "../../hooks/use-milestone-ui"
import { useToday } from "../../hooks/use-today"
import { showYear } from "../../store/ui-store"
import PaneHeader from "../../ui/pane-header"
import ToolbarButton from "../../ui/toolbar-button"
import DatePickBanner from "../calendar/date-pick-banner"
import YearCalendar from "../calendar/year-calendar"

export default function CalendarPane() {
  const year = useShownYear()
  const today = useToday()
  const thisYear = yearOf(today)

  return (
    <section className="relative flex h-full min-h-0 min-w-0 flex-col bg-white">
      <PaneHeader>
        <h1 className="mr-2 text-xl font-semibold tabular-nums tracking-tight">
          {year}
        </h1>
        <ToolbarButton
          aria-label="Previous year"
          onClick={() => {
            showYear(year - 1)
          }}
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          aria-label="Next year"
          onClick={() => {
            showYear(year + 1)
          }}
        >
          <ChevronRight aria-hidden="true" className="size-4" />
        </ToolbarButton>
        {/* Only worth offering once you have wandered off it. */}
        {year !== thisYear && (
          <ToolbarButton
            onClick={() => {
              showYear(thisYear)
            }}
          >
            This year
          </ToolbarButton>
        )}
      </PaneHeader>

      {/* The banner floats over the foot of the calendar rather than sitting
          under it, so entering the pick cannot resize the year and shift the
          day you were about to click out from under the pointer. */}
      <YearCalendar year={year} />
      <DatePickBanner />
    </section>
  )
}
