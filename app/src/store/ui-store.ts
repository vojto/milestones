import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { MilestoneId } from "./schema"

// Everything about how the app currently looks, kept deliberately outside
// TinyBase. The TinyBase store holds the document — one table — and its
// checkpoints therefore record document history and nothing else, which is
// what keeps undo from rewinding the selection or the year on screen.
//
// Two lifetimes live here. The list's width is chrome and persists under its
// own key; the selection, the rename in flight, the year being browsed and the
// date pick are session state that simply is not persisted — reopening the app
// should land you on this year with nothing highlighted. Every id resolves
// against the document, so a stale one is inert and needs no cleanup.

// Which of a milestone's two dates a pick in flight is for. The calendar draws
// the same way for both; only the label and where the chosen day lands differ.
export type DateField = "start" | "finish"

interface UiState {
  // Chrome (persisted).
  listWidth: number
  // Session (not persisted).
  selectedMilestoneId: MilestoneId | undefined
  editingMilestoneId: MilestoneId | undefined
  // The year the calendar is showing. Session state on purpose: the app is
  // about what is happening now, so it opens on this year however far you
  // wandered last time.
  year: number
  // The milestone a date is being picked for, which is also what says the
  // calendar is in picking mode at all. One id rather than a flag per row: the
  // calendar is a single surface, and a row cannot own what it is doing.
  pickingMilestoneId: MilestoneId | undefined
  pickingField: DateField | undefined
}

const INITIAL_UI_STATE: UiState = {
  listWidth: 380,
  selectedMilestoneId: undefined,
  editingMilestoneId: undefined,
  year: new Date().getFullYear(),
  pickingMilestoneId: undefined,
  pickingField: undefined,
}

export const useUiStore = create<UiState>()(
  persist(() => INITIAL_UI_STATE, {
    name: "milestones-ui",
    partialize: ({ listWidth }) => ({ listWidth }),
  }),
)

// For the operations layer, which reads this state outside React.
export function uiState(): UiState {
  return useUiStore.getState()
}

// The writers. Plain functions rather than state members: components reach
// them without subscribing, and the operations layer without a hook.

export function selectMilestone(milestoneId: MilestoneId) {
  useUiStore.setState({ selectedMilestoneId: milestoneId })
}

export function clearMilestoneSelection() {
  useUiStore.setState({ selectedMilestoneId: undefined })
}

// Renaming a milestone selects it: the row being typed into is the row the app
// is pointing at, so the two can never name different rows. That is what keeps
// a newly created milestone from leaving the highlight behind on whichever one
// was selected when it was created.
export function editMilestone(milestoneId: MilestoneId) {
  useUiStore.setState({
    selectedMilestoneId: milestoneId,
    editingMilestoneId: milestoneId,
  })
}

export function stopEditingMilestone() {
  useUiStore.setState({ editingMilestoneId: undefined })
}

export function showYear(year: number) {
  useUiStore.setState({ year })
}

// Both halves of a pick move together, so the calendar is never waiting for a
// day without knowing where to put it. Which of the two dates a pick is for is
// all this records; where the chosen day then lands belongs to
// operations/schedule.ts, which is what ends the pick.
export function startPickingDate(milestoneId: MilestoneId, field: DateField) {
  useUiStore.setState({
    selectedMilestoneId: milestoneId,
    pickingMilestoneId: milestoneId,
    pickingField: field,
  })
}

export function stopPickingDate() {
  useUiStore.setState({
    pickingMilestoneId: undefined,
    pickingField: undefined,
  })
}

export function setListWidth(width: number) {
  useUiStore.setState({ listWidth: width })
}
