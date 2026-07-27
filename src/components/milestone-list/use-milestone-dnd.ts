import type {
  DragDropManager,
  DragEndEvent,
  DragMoveEvent,
  DragOverEvent,
} from "@dnd-kit/react"
import { useRef } from "react"
import { useDb, type Db } from "../../store/hooks"
import {
  moveMilestone,
  shownMilestoneIds,
} from "../../store/operations/milestones"
import {
  currentCheckpoint,
  revertTo,
  sealUndoStep,
} from "../../store/operations/undo"
import type { MilestoneId } from "../../store/schema"

// TinyBase stays the source of truth mid-drag: every placement change is
// committed with moveMilestone, so the row order on screen is always the real
// order and the drop has nothing left to do but seal the checkpoint.
//
// Placement ignores the library's collision targets entirely. On every
// dragmove/dragover the same rule runs: the slot is how many row midlines the
// dragged card's center has passed. It depends only on the card's current
// rectangle, so re-running it after a commit gives the same answer and the
// order cannot oscillate.

function rectOf(manager: DragDropManager, id: string): DOMRect | undefined {
  return manager.registry.droppables.get(id)?.element?.getBoundingClientRect()
}

function commitPlacement(
  db: Db,
  manager: DragDropManager,
  event: DragMoveEvent | DragOverEvent,
  milestoneId: MilestoneId,
) {
  const y =
    event.operation.shape?.current.center.y ??
    event.operation.position.current.y
  const ids = shownMilestoneIds(db)
  // The dragged row is left out: its own rectangle is wherever the pointer
  // has taken it, which says nothing about where it belongs.
  const index = ids.filter((rowId) => {
    const rowRect = rowId === milestoneId ? undefined : rectOf(manager, rowId)
    return rowRect !== undefined && y > rowRect.top + rowRect.height / 2
  }).length
  // moveMilestone's index is relative to the list without the dragged row,
  // which equals the row's own index in the resulting order.
  if (ids.indexOf(milestoneId) !== index) {
    moveMilestone(db, milestoneId, index)
  }
}

export function useMilestoneDnd() {
  const db = useDb()
  const preDragCheckpointRef = useRef<string | null>(null)

  const handleDragStart = () => {
    // Reading the current checkpoint rather than adding one: the drag has
    // changed nothing yet, and sealing here would bank the pointerdown's
    // selection change as an undo step that undoes nothing.
    preDragCheckpointRef.current = currentCheckpoint(db) ?? null
  }

  // Wired to both dragmove and dragover: dragmove covers pointer movement,
  // dragover covers target changes without it (rows scrolling under a
  // stationary pointer). Never preventDefault() here — it freezes the drag.
  const handleDrag = (
    event: DragMoveEvent | DragOverEvent,
    manager: DragDropManager,
  ) => {
    const source = event.operation.source
    if (source === null) {
      return
    }
    const milestoneId = String(source.id)
    if (db.store.hasRow("milestones", milestoneId)) {
      commitPlacement(db, manager, event, milestoneId)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    if (event.canceled) {
      if (preDragCheckpointRef.current !== null) {
        revertTo(db, preDragCheckpointRef.current)
      }
      return
    }
    // Seals the whole drag as one undo step (no-op when nothing changed).
    sealUndoStep(db, "Reorder milestones")
  }

  return { handleDrag, handleDragEnd, handleDragStart }
}
