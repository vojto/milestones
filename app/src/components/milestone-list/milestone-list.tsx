import { useRef } from "react"
import { useShownYear } from "../../hooks/use-milestone-ui"
import { useFlipList } from "../../hooks/use-flip-list"
import { clearMilestoneSelection } from "../../store/ui-store"
import { closestElement } from "../../ui/closest-element"
import MilestoneRow from "./milestone-row"
import { useShownMilestones } from "./use-shown-milestones"

// The scrollable list of milestones for the year the calendar is showing.
// Rows are ordered by the fractional `position` cell, which is the user's own
// ordering and has nothing to do with the dates — a milestone can sit at the
// top of the list and have run last.
export default function MilestoneList() {
  const year = useShownYear()
  const { hasAnyMilestones, milestoneIds } = useShownMilestones()
  // Row reordering is animated by our own pre-paint FLIP pass; the library's
  // index transition is disabled on the rows because it animates on the
  // library's render clock, one frame behind our TinyBase-driven re-renders
  // (visible as a crossing flicker).
  const listRef = useRef<HTMLUListElement>(null)
  useFlipList(listRef)

  return (
    <div
      className="flex-1 overflow-y-auto px-5 pb-8 pt-6"
      // Deselect on presses that land outside any row; row presses bubble up
      // here but have already selected via the row's own handler.
      onPointerDown={(event) => {
        if (closestElement(event.target, '[role="option"]') === undefined) {
          clearMilestoneSelection()
        }
      }}
    >
      {milestoneIds.length === 0 ? (
        // An empty year and an empty app are different things to be told.
        <p className="px-3 text-neutral-400">
          {hasAnyMilestones
            ? `Nothing in ${year}.`
            : "No milestones yet. Add one, then right-click it to say when it started."}
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
