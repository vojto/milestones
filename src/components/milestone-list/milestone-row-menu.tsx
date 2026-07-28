import { todayKey } from "../../dates/day"
import { useCell, useDb } from "../../store/hooks"
import { deleteMilestone } from "../../store/operations/milestones"
import {
  clearMilestoneDates,
  finishMilestoneOn,
  reopenMilestone,
  startMilestoneOn,
} from "../../store/operations/schedule"
import type { MilestoneId } from "../../store/schema"
import { editMilestone, startPickingDate } from "../../store/ui-store"
import { ContextMenuItem, ContextMenuSeparator } from "../../ui/context-menu"
import MilestoneColorMenu from "./milestone-color-menu"

// Everything a milestone can be told to do, in three groups: when it ran, when
// it ran precisely, and what it is. Its own file so ./milestone-row stays the
// row — a list of commands grows and the thing it hangs off does not.
//
// Which items are offered is the milestone's own state read back: a milestone
// that has not started has no end to talk about, and one that has finished
// offers the way back instead of the way out. Every item calls the same
// functions in store/operations that the keyboard and the menu bar call, so a
// command cannot mean one thing here and another there. "Today" is read at
// click time rather than from the render, which keeps a window left open
// overnight honest — renameMilestone is the exception and belongs to the
// inline editor; this menu only opens it.
export default function MilestoneRowMenu({
  milestoneId,
}: {
  milestoneId: MilestoneId
}) {
  const db = useDb()
  const startedAt = useCell("milestones", milestoneId, "startedAt")
  const finishedAt = useCell("milestones", milestoneId, "finishedAt")
  const hasStarted = startedAt !== undefined

  return (
    <>
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
    </>
  )
}
