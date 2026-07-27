import { Feedback } from "@dnd-kit/dom"
import { SortableKeyboardPlugin } from "@dnd-kit/dom/sortable"
import { useSortable } from "@dnd-kit/react/sortable"
import type { MilestoneId } from "../../store/schema"

// Registers a list row with the drag-drop provider and returns its ref. The
// library configuration is fiddly enough to bury what a row actually does, so
// it lives here rather than in the component.
export const MILESTONE_GROUP = "milestones"

export function useSortableRow({
  index,
  milestoneId,
}: {
  index: number
  milestoneId: MilestoneId
}) {
  const { ref } = useSortable({
    id: milestoneId,
    index,
    group: MILESTONE_GROUP,
    type: "item",
    accept: "item",
    // The library's index transition animates on its own render clock, one
    // frame behind our TinyBase-driven re-renders (visible flicker when rows
    // cross); useFlipList animates reorders pre-paint instead. NOT null — the
    // React wrapper spreads input.transition over the defaults, so null is
    // silently ignored; duration 0 survives the merge.
    transition: { duration: 0 },
    // 0.5.0 has no top-level `feedback` input; it is per-entity plugin config.
    // The OptimisticSortingPlugin default is deliberately left out: we commit
    // the real order on every hover, so its speculative reorder would fight
    // the React re-render (double movement = crossing flicker).
    plugins: [
      SortableKeyboardPlugin,
      Feedback.configure({ feedback: "clone" }),
    ],
  })
  return ref
}
