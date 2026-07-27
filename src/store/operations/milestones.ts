import { nextColorKey } from "../../ui/milestone-colors"
import type { Db } from "../hooks"
import type { MilestoneId } from "../schema"
import {
  clearMilestoneSelection,
  editMilestone,
  selectMilestone,
  uiState,
} from "../ui-store"
import { asUndoStep } from "./undo"

// Creating, naming, coloring and ordering a milestone. What its dates mean —
// and the rule that no two milestones may cover the same day — lives next
// door in ./schedule.
//
// addMilestone and moveMilestone are building blocks: a drag calls moveMilestone
// on every pointer move and seals the whole gesture as one step, so they must
// not seal one each. Everything else here is a whole user action and does.

export function milestoneIds(db: Db): readonly MilestoneId[] {
  return db.store.getSortedRowIds("milestones", "position")
}

function positionOf(db: Db, milestoneId: MilestoneId): number {
  return db.store.getCell("milestones", milestoneId, "position") ?? 0
}

// Fractional positioning: dropping between two milestones takes their
// midpoint, so inserts never renumber neighbors.
function insertPosition(
  db: Db,
  index?: number,
  excludeMilestoneId?: MilestoneId,
): number {
  const ids = milestoneIds(db).filter((id) => id !== excludeMilestoneId)
  const nextId = index === undefined ? undefined : ids[index]
  if (index === undefined || nextId === undefined) {
    const lastId = ids.at(-1)
    return lastId === undefined ? 1 : positionOf(db, lastId) + 1
  }
  const next = positionOf(db, nextId)
  const previousId = ids[index - 1]
  return previousId === undefined
    ? next - 1
    : (positionOf(db, previousId) + next) / 2
}

// A new milestone starts unnamed, undated and wearing whichever color nobody
// has taken. It gets no dates: creating one is saying it exists, and when it
// started is a separate thing to say (see ./schedule).
export function addMilestone(db: Db, index?: number): MilestoneId {
  const id: MilestoneId = `milestone-${crypto.randomUUID()}`
  const takenKeys = milestoneIds(db).map(
    (milestoneId) => db.store.getCell("milestones", milestoneId, "color") ?? "",
  )
  db.store.setRow("milestones", id, {
    name: "",
    position: insertPosition(db, index),
    color: nextColorKey(takenKeys),
  })
  return id
}

// Where a milestone you ask for lands: directly below the selected one, so a
// milestone made partway down the list appears where you are looking rather
// than at the bottom. No selection — or one naming a row that is gone — means
// there is no "here" to insert at, and it appends.
function indexBelowSelection(db: Db): number | undefined {
  const { selectedMilestoneId } = uiState()
  if (selectedMilestoneId === undefined) {
    return undefined
  }
  const index = milestoneIds(db).indexOf(selectedMilestoneId)
  return index === -1 ? undefined : index + 1
}

// Creating a milestone is always "creating and naming it": one step, so the
// new row's first render is already in edit mode and no unnamed row flashes
// past. Every entry point — the toolbar, the list menu, the keyboard — goes
// through here, which is what keeps them from drifting apart.
export function createMilestone(db: Db) {
  asUndoStep(db, "New milestone", () => {
    editMilestone(addMilestone(db, indexBelowSelection(db)))
  })
}

export function renameMilestone(
  db: Db,
  milestoneId: MilestoneId,
  name: string,
) {
  asUndoStep(db, "Rename milestone", () => {
    db.store.setCell("milestones", milestoneId, "name", name)
  })
}

// The key of an option in ui/milestone-colors.ts. Unlike the dates, a
// milestone always wears one — milestoneColor() resolves anything unrecognized
// — so there is no "no color" to write.
export function setMilestoneColor(
  db: Db,
  milestoneId: MilestoneId,
  colorKey: string,
) {
  asUndoStep(db, "Change color", () => {
    db.store.setCell("milestones", milestoneId, "color", colorKey)
  })
}

// Stepping the selection off the row is part of deleting it, not part of the
// keyboard: the row menu deletes too, and it would otherwise leave the
// selection naming a row that no longer exists. Undo brings the milestone back
// without moving the selection again — it is session state, which undo holds
// still (see ./undo).
export function deleteMilestone(db: Db, milestoneId: MilestoneId) {
  asUndoStep(db, "Delete milestone", () => {
    moveSelectionOff(db, milestoneId)
    db.store.delRow("milestones", milestoneId)
  })
}

// Onto the milestone that will slide up into its place — or the one above it
// when it was last.
function moveSelectionOff(db: Db, milestoneId: MilestoneId) {
  if (uiState().selectedMilestoneId !== milestoneId) {
    return
  }
  const ids = milestoneIds(db)
  const index = ids.indexOf(milestoneId)
  const successorId = ids[index + 1] ?? ids[index - 1]
  if (successorId === undefined) {
    clearMilestoneSelection()
  } else {
    selectMilestone(successorId)
  }
}

// Moves a milestone to the given place in the list order. The list is the
// user's own ordering — priority, or the order they think about them in — and
// has nothing to do with the dates, so reordering never touches those.
export function moveMilestone(db: Db, milestoneId: MilestoneId, index: number) {
  if (!db.store.hasRow("milestones", milestoneId)) {
    return
  }
  db.store.setCell(
    "milestones",
    milestoneId,
    "position",
    insertPosition(db, index, milestoneId),
  )
}
