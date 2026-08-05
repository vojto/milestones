import { setListWidth, useUiStore } from "../store/ui-store"

// The screen is a three-column grid: calendar, separator, milestone list. Only
// the list has a stored width; the calendar takes what is left, which is what
// lets it reflow from four columns of months down to two.
const MIN_LIST_WIDTH = 300
const MIN_CALENDAR_WIDTH = 420
const SEPARATOR_WIDTH = 1

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum)
}

export function usePaneWidths() {
  const listWidth = useUiStore((ui) => ui.listWidth)

  return {
    gridTemplateColumns: `minmax(0, 1fr) ${SEPARATOR_WIDTH}px ${listWidth}px`,

    // Dragged from the list's left edge, so the pointer measures the calendar;
    // the maximum is whatever leaves the calendar its minimum.
    resizeList: (pointerX: number) => {
      setListWidth(
        clamp(
          window.innerWidth - pointerX,
          MIN_LIST_WIDTH,
          window.innerWidth - MIN_CALENDAR_WIDTH - SEPARATOR_WIDTH,
        ),
      )
    },
  }
}
