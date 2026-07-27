import { useRef, type ReactNode } from "react"
import { useFlipList } from "../../hooks/use-flip-list"
import { useSortedRowIds } from "../../store/hooks"
import { clearMilestoneSelection } from "../../store/ui-store"
import MilestoneRow from "./milestone-row"

// The scrollable list of milestones. Rows are ordered by the fractional
// `position` cell, which is the user's own ordering and has nothing to do with
// the dates — a milestone can sit at the top of the list and have run last.
export default function MilestoneList({ header }: { header?: ReactNode }) {
  const milestoneIds = useSortedRowIds("milestones", "position")
  // Row reordering is animated by our own pre-paint FLIP pass; the library's
  // index transition is disabled on the rows because it animates on the
  // library's render clock, one frame behind our TinyBase-driven re-renders
  // (visible as a crossing flicker).
  const listRef = useRef<HTMLUListElement>(null)
  useFlipList(listRef)

  return (
    <div
      // The top padding matches the calendar pane's header, so the two titles
      // sit on one line across the window.
      className="flex-1 overflow-y-auto px-5 pb-8 pt-4"
      // Deselect on presses that land outside any row; row presses bubble up
      // here but have already selected via the row's own handler.
      onPointerDown={(event) => {
        if (!(event.target as Element).closest('[role="option"]')) {
          clearMilestoneSelection()
        }
      }}
    >
      {header}
      {milestoneIds.length === 0 ? (
        <p className="px-3 text-neutral-400">
          No milestones yet. Add one, then right-click it to say when it
          started.
        </p>
      ) : (
        <ul aria-label="Milestones" ref={listRef} role="listbox">
          {milestoneIds.map((milestoneId, index) => (
            <MilestoneRow
              index={index}
              key={milestoneId}
              milestoneId={milestoneId}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
