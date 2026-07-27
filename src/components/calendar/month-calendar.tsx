import { monthName, WEEKDAYS } from "../../dates/day"
import CalendarDay from "./calendar-day"
import { monthWeeks } from "./month-weeks"
import type { CalendarView } from "./use-calendar-view"

// One month, as the table it looks like. Zero horizontal spacing is what lets
// a milestone's days join into a continuous band across a week; the vertical
// spacing is what keeps the weeks from reading as one block of color.
export default function MonthCalendar({
  month,
  view,
  year,
}: {
  month: number
  view: CalendarView
  year: number
}) {
  const name = monthName(year, month)

  return (
    <section>
      <h3 className="mb-1.5 px-0.5 text-xs font-semibold text-neutral-700">
        {name}
      </h3>
      <table className="w-full table-fixed border-separate border-spacing-x-0 border-spacing-y-0.5">
        <caption className="sr-only">
          {name} {year}
        </caption>
        <thead>
          <tr>
            {WEEKDAYS.map(({ name: weekdayName, weekday }) => (
              <th
                className="pb-1 text-[10px] font-normal text-neutral-400"
                key={weekday}
                scope="col"
              >
                {weekdayName}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {monthWeeks(year, month).map((week) => (
            <tr key={week[0]}>
              {week.map((day) => (
                <CalendarDay day={day} key={day} month={month} view={view} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
