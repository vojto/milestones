import { todayKey } from "../../dates/day"
import type { ContextMenuItem } from "../../platform/context-menu"
import type { Db } from "../../store/hooks"
import { deleteMilestone } from "../../store/operations/milestones"
import {
  clearMilestoneDates,
  finishMilestoneOn,
  reopenMilestone,
  startMilestoneOn,
} from "../../store/operations/schedule"
import type { MilestoneId } from "../../store/schema"
import { editMilestone, startPickingDate } from "../../store/ui-store"
import { milestoneColorMenu } from "./milestone-color-menu"

// Everything a milestone can be told to do, in three groups: when it ran, when
// it ran precisely, and what it is. Its own module so ./milestone-row stays the
// row — a list of commands grows and the thing it hangs off does not.
//
// Which items are offered is the milestone's own state read back: a milestone
// that has not started has no end to talk about, and one that has finished
// offers the way back instead of the way out. Every item calls the same
// functions in store/operations that the keyboard and the menu bar call, so a
// command cannot mean one thing here and another there. Both the state and
// "today" are read when the menu is built rather than at render, which keeps a
// window left open overnight honest — renameMilestone is the exception and
// belongs to the inline editor; this menu only opens it.
export function milestoneRowMenu(
  db: Db,
  milestoneId: MilestoneId,
): ContextMenuItem[] {
  const startedAt = db.store.getCell("milestones", milestoneId, "startedAt")
  const finishedAt = db.store.getCell("milestones", milestoneId, "finishedAt")
  const hasStarted = startedAt !== undefined

  return [
    {
      label: "Start today",
      run: () => {
        startMilestoneOn(db, milestoneId, todayKey())
      },
    },
    ...(hasStarted && finishedAt === undefined
      ? [
          {
            label: "Finish today",
            run: () => {
              finishMilestoneOn(db, milestoneId, todayKey())
            },
          },
        ]
      : []),
    ...(finishedAt !== undefined
      ? [
          {
            label: "Mark as in progress",
            run: () => {
              reopenMilestone(db, milestoneId)
            },
          },
        ]
      : []),

    "separator",

    {
      label: "Start on day…",
      run: () => {
        startPickingDate(milestoneId, "start")
      },
    },
    ...(hasStarted
      ? [
          {
            label: "Finish on day…",
            run: () => {
              startPickingDate(milestoneId, "finish")
            },
          },
          {
            label: "Clear dates",
            run: () => {
              clearMilestoneDates(db, milestoneId)
            },
          },
        ]
      : []),

    "separator",

    milestoneColorMenu(db, milestoneId),
    {
      label: "Rename",
      run: () => {
        editMilestone(milestoneId)
      },
    },
    {
      label: "Delete",
      run: () => {
        deleteMilestone(db, milestoneId)
      },
    },
  ]
}
