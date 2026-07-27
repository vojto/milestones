import { useLayoutEffect, useRef, useState } from "react"

// How the year is made to fit. Scrolling would defeat what the pane is for —
// a year you have to scroll is not a year you can see the shape of — so the
// months are laid out at one natural size and the whole grid is then scaled to
// whatever room the pane has. Everything scales together, so a small window
// gets a small year rather than a partial one.
//
// Every month is the same height (see ./month-weeks), which is what makes the
// arithmetic here possible: one measured month says how tall any layout of
// twelve of them would be, so the layouts can be compared without rendering
// them.

// One month before scaling. The number matters only as a ratio against the
// month's measured height — the scale factor decides what it comes out as on
// screen.
export const MONTH_WIDTH = 150
export const GAP_X = 24
export const GAP_Y = 20
// Breathing room around the year, in the pane's own pixels rather than scaled
// ones, so it stays the same margin however small the year gets.
const INSET = 24
// Layouts that divide twelve, so the year always comes out as full rows of
// months rather than a ragged last row.
const COLUMN_CHOICES = [1, 2, 3, 4, 6]

export interface CalendarFit {
  columns: number
  scale: number
}

function scaleFor(
  columns: number,
  monthHeight: number,
  width: number,
  height: number,
): number {
  const rows = 12 / columns
  return Math.min(
    width / (columns * MONTH_WIDTH + (columns - 1) * GAP_X),
    height / (rows * monthHeight + (rows - 1) * GAP_Y),
  )
}

// The layout that gets the months as big as they will go: a wide pane fills
// with few rows, a tall one with few columns, and which it is falls out of the
// space rather than out of a breakpoint.
function bestFit(
  monthHeight: number,
  width: number,
  height: number,
): CalendarFit {
  let best: CalendarFit = { columns: 4, scale: 0 }
  for (const columns of COLUMN_CHOICES) {
    const scale = scaleFor(columns, monthHeight, width, height)
    if (scale > best.scale) {
      best = { columns, scale }
    }
  }
  return best
}

export function useCalendarFit() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState<CalendarFit>({ columns: 4, scale: 1 })

  // A ResizeObserver rather than a render-time measurement: the pane is
  // resized by dragging the separator and by resizing the window, and only the
  // first of those goes through React at all. It fires once on observe, which
  // is also the first measurement.
  useLayoutEffect(() => {
    const container = containerRef.current
    const grid = gridRef.current
    if (container === null || grid === null) {
      return
    }

    const observer = new ResizeObserver(() => {
      // The first month, measured unscaled: offsetHeight ignores transforms,
      // and every month is the same height, so one of them describes them all.
      const month = grid.firstElementChild
      if (!(month instanceof HTMLElement)) {
        return
      }
      const next = bestFit(
        month.offsetHeight,
        container.clientWidth - 2 * INSET,
        container.clientHeight - 2 * INSET,
      )
      setFit((previous) =>
        previous.columns === next.columns && previous.scale === next.scale
          ? previous
          : next,
      )
    })
    observer.observe(container)

    return () => {
      observer.disconnect()
    }
  }, [])

  return { containerRef, gridRef, ...fit }
}
