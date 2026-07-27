import { todayKey } from "../../dates/day"
import {
  useIsMilestoneEditing,
  useIsMilestoneSelected,
} from "../../hooks/use-milestone-ui"
import { useCell, useDb } from "../../store/hooks"
import {
  deleteMilestone,
  renameMilestone,
} from "../../store/operations/milestones"
import {
  clearMilestoneDates,
  finishMilestoneOn,
  reopenMilestone,
  startMilestoneOn,
} from "../../store/operations/schedule"
import type { MilestoneId } from "../../store/schema"
import {
  editMilestone,
  selectMilestone,
  startPickingDate,
  stopEditingMilestone,
} from "../../store/ui-store"
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuSeparator,
} from "../../ui/context-menu"
import InlineEditInput from "../../ui/inline-edit-input"
import MilestoneColorMenu from "./milestone-color-menu"
import MilestoneRowCard from "./milestone-row-card"
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
  const startedAt = useCell("milestones", milestoneId, "startedAt")
  const finishedAt = useCell("milestones", milestoneId, "finishedAt")
  // While dragging, the library floats the real row (data-dnd-dragging) and
  // keeps a cloned stand-in in the list flow (data-dnd-placeholder); the data
  // variants below style those two states. Every placement change commits the
  // real order, so the stand-in is always the true drop position.
  const ref = useSortableRow({ index, milestoneId })

  // A milestone that has not started has no end to talk about, so the menu
  // offers only the two ways to begin it. Reading "today" at click time rather
  // than from the render keeps a window left open overnight honest.
  const hasStarted = startedAt !== undefined

  return (
    <ContextMenu
      trigger={
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
          // The pane behind us opens its own menu on background right-clicks;
          // keep row right-clicks from reaching it so only the row menu opens.
          onContextMenu={(event) => {
            event.stopPropagation()
          }}
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
      }
    >
      <ContextMenuItem
        onClick={() => {
          startMilestoneOn(db, milestoneId, todayKey())
        }}
      >
        Start today
      </ContextMenuItem>
      {hasStarted && finishedAt === undefined && (
        <ContextMenuItem
          onClick={() => {
            finishMilestoneOn(db, milestoneId, todayKey())
          }}
        >
          Finish today
        </ContextMenuItem>
      )}
      {finishedAt !== undefined && (
        <ContextMenuItem
          onClick={() => {
            reopenMilestone(db, milestoneId)
          }}
        >
          Mark as in progress
        </ContextMenuItem>
      )}

      <ContextMenuSeparator />

      <ContextMenuItem
        onClick={() => {
          startPickingDate(milestoneId, "start")
        }}
      >
        Start on day…
      </ContextMenuItem>
      {hasStarted && (
        <ContextMenuItem
          onClick={() => {
            startPickingDate(milestoneId, "finish")
          }}
        >
          Finish on day…
        </ContextMenuItem>
      )}
      {hasStarted && (
        <ContextMenuItem
          onClick={() => {
            clearMilestoneDates(db, milestoneId)
          }}
        >
          Clear dates
        </ContextMenuItem>
      )}

      <ContextMenuSeparator />

      <MilestoneColorMenu milestoneId={milestoneId} />
      <ContextMenuItem
        onClick={() => {
          editMilestone(milestoneId)
        }}
      >
        Rename
      </ContextMenuItem>
      <ContextMenuItem
        danger
        onClick={() => {
          deleteMilestone(db, milestoneId)
        }}
      >
        Delete
      </ContextMenuItem>
    </ContextMenu>
  )
}
