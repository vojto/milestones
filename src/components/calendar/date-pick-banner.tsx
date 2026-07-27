import { MousePointerClick } from "lucide-react"
import {
  usePickingField,
  usePickingMilestoneId,
} from "../../hooks/use-milestone-ui"
import { useCell } from "../../store/hooks"
import { stopPickingDate } from "../../store/ui-store"
import { displayName, MILESTONE_PLACEHOLDER_NAME } from "../../ui/display-name"

// What the calendar says while it is an input rather than a chart. It names
// the milestone and which of its two dates is being set — the year has gone
// plain by then, so without this there would be nothing on screen saying why.
// The way out is on the banner itself, not only on the Escape key, because a
// mode you can see is a mode you must be able to leave by pointing at it.
export default function DatePickBanner() {
  const milestoneId = usePickingMilestoneId()
  const field = usePickingField()
  const name = useCell("milestones", milestoneId ?? "", "name")

  if (milestoneId === undefined || field === undefined) {
    return null
  }

  const { text } = displayName(name, MILESTONE_PLACEHOLDER_NAME)

  return (
    <div className="mx-6 mb-6 flex shrink-0 items-center gap-2.5 rounded-lg bg-neutral-900 px-3 py-2 text-white">
      <MousePointerClick aria-hidden="true" className="size-4 shrink-0" />
      <p className="min-w-0 flex-1 truncate">
        Pick the day <span className="font-medium">{text}</span>{" "}
        {field === "start" ? "started" : "finished"}
      </p>
      <button
        className="shrink-0 rounded-md px-2 py-1 text-neutral-300 outline-none transition-colors hover:bg-white/10 hover:text-white"
        onClick={stopPickingDate}
        type="button"
      >
        Cancel
        <span className="ml-1.5 text-xs text-neutral-500">Esc</span>
      </button>
    </div>
  )
}
