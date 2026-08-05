import { useEffect } from "react"
import { useDb, type Db } from "../store/hooks"
import {
  deleteMilestone,
  shownMilestoneIds,
} from "../store/operations/milestones"
import {
  clearMilestoneSelection,
  editMilestone,
  selectMilestone,
  stopPickingDate,
  uiState,
} from "../store/ui-store"

// The window-level keymap. The inline rename input stops its own keys from
// reaching here, so a listener on the window needs no "am I typing?" check.
//
// Only the bare keys live here. Anything with a modifier — undo, redo, new
// milestone — is an accelerator on a menu item instead (platform/app-menu.ts),
// which is where a desktop user looks for it and what lets it grey out when it
// does not apply. Two listeners for one keystroke would fire twice, so this
// one steps aside as soon as a modifier is held.
//
// Every command reads what it acts on from the stores rather than being handed
// it, which is what keeps a key and the menu item beside it doing the same
// thing.

// The selection, resolved: a pair naming a row that has since been deleted is
// no selection at all, which is what sends the next arrow key back to the top
// of the list instead of nowhere.
function selectedMilestoneId(db: Db): string | undefined {
  const { selectedMilestoneId: milestoneId } = uiState()
  return milestoneId !== undefined && db.store.hasRow("milestones", milestoneId)
    ? milestoneId
    : undefined
}

// Moves the selection by `offset` rows — through the list as shown, which is
// one year of it. With nothing selected it enters the list from the end it is
// heading for: down lands on the first row, up on the last. At either end it
// stays put.
function moveSelection(db: Db, offset: number) {
  const ids = shownMilestoneIds(db)
  const selectedId = selectedMilestoneId(db)
  const nextId =
    selectedId === undefined
      ? offset > 0
        ? ids[0]
        : ids.at(-1)
      : ids[ids.indexOf(selectedId) + offset]
  if (nextId !== undefined) {
    selectMilestone(nextId)
  }
}

// Escape backs out of one thing at a time, outermost first: the date pick is a
// mode you are held in, so it goes before the selection does.
function handleEscape() {
  if (uiState().pickingMilestoneId !== undefined) {
    stopPickingDate()
  } else {
    clearMilestoneSelection()
  }
}

export function useKeyboard() {
  const db = useDb()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) {
        return
      }

      const selectedId = selectedMilestoneId(db)

      switch (event.key) {
        case "Escape":
          handleEscape()
          break
        case "ArrowDown":
          event.preventDefault()
          moveSelection(db, 1)
          break
        case "ArrowUp":
          event.preventDefault()
          moveSelection(db, -1)
          break
        case "Enter":
          if (selectedId !== undefined) {
            event.preventDefault()
            editMilestone(selectedId)
          }
          break
        case "Backspace":
        case "Delete":
          if (selectedId !== undefined) {
            event.preventDefault()
            deleteMilestone(db, selectedId)
          }
          break
        default:
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [db])
}
