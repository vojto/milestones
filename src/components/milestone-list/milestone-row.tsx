import {
  useIsMilestoneEditing,
  useIsMilestoneSelected,
} from "../../hooks/use-milestone-ui"
import { contextMenuHandler } from "../../platform/context-menu"
import { useCell, useDb } from "../../store/hooks"
import { renameMilestone } from "../../store/operations/milestones"
import type { MilestoneId } from "../../store/schema"
import {
  editMilestone,
  selectMilestone,
  stopEditingMilestone,
} from "../../store/ui-store"
import InlineEditInput from "../../ui/inline-edit-input"
import MilestoneRowCard from "./milestone-row-card"
import { milestoneRowMenu } from "./milestone-row-menu"
import { useSortableRow } from "./use-sortable-row"

export default function MilestoneRow({
  index,
  milestoneId,
}: {
  index: number
  milestoneId: MilestoneId
}) {
  const db = useDb()
  const isSelected = useIsMilestoneSelected(milestoneId)
  const isEditing = useIsMilestoneEditing(milestoneId)
  const name = useCell("milestones", milestoneId, "name")
  // While dragging, the library floats the real row (data-dnd-dragging) and
  // keeps a cloned stand-in in the list flow (data-dnd-placeholder); the data
  // variants below style those two states. Every placement change commits the
  // real order, so the stand-in is always the true drop position.
  const ref = useSortableRow({ index, milestoneId })

  return (
    <li
      ref={ref}
      className="touch-none data-[dnd-dragging]:rounded-lg data-[dnd-dragging]:bg-white data-[dnd-dragging]:shadow-lg data-[dnd-placeholder]:rounded-lg data-[dnd-placeholder]:bg-neutral-100 [&[data-dnd-placeholder]_div]:invisible"
      data-flip-id={milestoneId}
      // Focusable so keyboard users can select, and so the library's
      // keyboard sorting can pick the row up.
      aria-selected={isSelected}
      role="option"
      tabIndex={0}
      // Selection happens on pointer down (not click) so a milestone is
      // already selected when a drag starts, and stays highlighted while
      // dragged.
      onPointerDown={() => {
        selectMilestone(milestoneId)
      }}
      onDoubleClick={() => {
        editMilestone(milestoneId)
      }}
      // The pane behind us has a menu of its own for background right-clicks;
      // the handler stops the event, so only the row menu opens.
      onContextMenu={contextMenuHandler(() =>
        milestoneRowMenu(db, milestoneId),
      )}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          editMilestone(milestoneId)
        }
      }}
    >
      {/* Both modes render the same element tree — a branch returning a
          different wrapper would remount the row and kill the css
          transition into edit mode. */}
      <MilestoneRowCard
        isEditing={isEditing}
        isSelected={isSelected}
        milestoneId={milestoneId}
      >
        {isEditing ? (
          <InlineEditInput
            className="min-w-0 flex-1 select-text bg-transparent p-0 text-neutral-800 outline-none"
            initialValue={name ?? ""}
            onCancel={stopEditingMilestone}
            onCommit={(nextName) => {
              if (nextName !== undefined) {
                renameMilestone(db, milestoneId, nextName)
              }
              stopEditingMilestone()
            }}
          />
        ) : undefined}
      </MilestoneRowCard>
    </li>
  )
}
