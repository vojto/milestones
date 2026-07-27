import type { MilestoneId } from "../store/schema"
import { useUiStore, type DateField } from "../store/ui-store"

// The named readers of ../store/ui-store. Selectors must return primitives,
// never fresh objects, so each question a component actually asks gets its own
// hook rather than one hook handing back a bag of state.

export function useIsMilestoneSelected(milestoneId: MilestoneId): boolean {
  return useUiStore((ui) => ui.selectedMilestoneId === milestoneId)
}

export function useIsMilestoneEditing(milestoneId: MilestoneId): boolean {
  return useUiStore((ui) => ui.editingMilestoneId === milestoneId)
}

export function useSelectedMilestoneId(): MilestoneId | undefined {
  return useUiStore((ui) => ui.selectedMilestoneId)
}

export function useShownYear(): number {
  return useUiStore((ui) => ui.year)
}

// The milestone a date is being picked for, which by being set at all is what
// says the calendar is in picking mode.
export function usePickingMilestoneId(): MilestoneId | undefined {
  return useUiStore((ui) => ui.pickingMilestoneId)
}

export function usePickingField(): DateField | undefined {
  return useUiStore((ui) => ui.pickingField)
}
