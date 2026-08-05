import type { ReactNode } from "react"

// The bar at the top of a pane. Both panes use it, so the seam runs straight
// across the window and the two titles sit on one line.
//
// Its height is fixed rather than left to its contents. The calendar's header
// gains and loses a button as you wander off this year, and a header that grew
// by those few pixels would resize the year underneath it — the calendar is
// scaled to exactly the room it has (see components/calendar/use-calendar-fit),
// so anything above it moving is the whole year moving.
export default function PaneHeader({ children }: { children: ReactNode }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-1 border-b border-neutral-200 bg-neutral-50 px-5">
      {children}
    </header>
  )
}
