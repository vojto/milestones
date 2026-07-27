// A day, as the "YYYY-MM-DD" string the document stores. Everything the app
// reasons about is a whole day in the user's own timezone — never an instant —
// so a plain key is the honest representation: it survives a timezone change,
// it compares chronologically with `<` and `>` because the fields are
// zero-padded and biggest-first, and it is the same string in the store as on
// screen. Date objects appear only inside this module, to do arithmetic and
// formatting, and never leave it.

export type DayKey = string

// Midday rather than midnight, so adding days can never land on the hour a
// DST change removes and slip into the day before.
function dateOf(day: DayKey): Date {
  const [year = 0, month = 1, date = 1] = day.split("-").map(Number)
  return new Date(year, month - 1, date, 12)
}

export function dayKeyOf(date: Date): DayKey {
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const dayOfMonth = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${dayOfMonth}`
}

export function todayKey(): DayKey {
  return dayKeyOf(new Date())
}

export function addDays(day: DayKey, offset: number): DayKey {
  const date = dateOf(day)
  date.setDate(date.getDate() + offset)
  return dayKeyOf(date)
}

// Counting both ends: a milestone that started and finished today lasted one
// day, not zero. That is what the badge on a milestone row prints.
export function dayCount(from: DayKey, to: DayKey): number {
  return Math.round(
    (dateOf(to).getTime() - dateOf(from).getTime()) / 86_400_000 + 1,
  )
}

export function yearOf(day: DayKey): number {
  return dateOf(day).getFullYear()
}

const SHORT_DATE = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
})

const SHORT_DATE_WITH_YEAR = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
})

// The year is dropped for days in `contextYear` — the calendar beside the list
// is already showing it, so repeating it on every row is noise. A day outside
// it keeps its year, which is the only thing that says it is elsewhere.
export function formatDay(day: DayKey, contextYear?: number): string {
  const format = yearOf(day) === contextYear ? SHORT_DATE : SHORT_DATE_WITH_YEAR
  return format.format(dateOf(day))
}

const MONTH_NAME = new Intl.DateTimeFormat(undefined, { month: "long" })

export function monthName(year: number, month: number): string {
  return MONTH_NAME.format(new Date(year, month, 1, 12))
}

// Which month a day falls in, as the 0–11 the Date API and the calendar grid
// both count in.
export function monthOf(day: DayKey): number {
  return dateOf(day).getMonth()
}

// Monday to Friday, which is what the weekday header row and the month grid
// both have to agree on. Kept here rather than in the grid so the two cannot
// drift, and its length is what "a week" means everywhere the calendar counts
// columns.
//
// The weekend is not drawn at all (see components/calendar/month-weeks), so
// these five are the whole week as far as the app is concerned.
const WEEKDAY_NAME = new Intl.DateTimeFormat(undefined, { weekday: "narrow" })

// Narrow weekday names repeat — T stands for Tuesday and Thursday — so a
// weekday's place in the week travels with it as its identity.
export const WEEKDAYS: readonly { name: string; weekday: number }[] =
  Array.from({ length: 5 }, (_unused, weekday) => ({
    // 2024-01-01 was a Monday.
    name: WEEKDAY_NAME.format(new Date(2024, 0, 1 + weekday, 12)),
    weekday,
  }))

// How far into a Monday-first week a day sits: Monday 0 … Sunday 6. Saturday
// and Sunday still have an index — they are real days that milestones run
// through — they simply have no column.
export function weekdayIndex(day: DayKey): number {
  return (dateOf(day).getDay() + 6) % 7
}
