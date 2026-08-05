import { MousePointerClick } from "lucide-react"
import {
  usePickingField,
  usePickingMilestoneId,
} from "../../hooks/use-milestone-ui"
import { useCell } from "../../store/hooks"
import { stopPickingDate } from "../../store/ui-store"
import { displayName } from "../../ui/display-name"

// What the calendar says while it is an input rather than a chart. It names
// the milestone and which of its two dates is being set — the year has gone
// plain by then, so without this there would be nothing on screen saying why.
// The way out is on the banner itself, not only on the Escape key, because a
// mode you can see is a mode you must be able to leave by pointing at it.
//
// It floats over the foot of the calendar rather than taking a strip of its
// own: the year fills the pane exactly (see ./year-calendar), so anything that
// claimed layout space would shrink the months every time a pick started. Only
// as wide as its own words, and translucent, so the days underneath stay
// readable — the day being picked may well be one of them.
export default function DatePickBanner() {
  const milestoneId = usePickingMilestoneId()
  const field = usePickingField()
  const name = useCell("milestones", milestoneId ?? "", "name")

  if (milestoneId === undefined || field === undefined) {
    return null
  }

  const { text } = displayName(name)

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center px-6">
      <div className="pointer-events-auto flex max-w-full items-center gap-2.5 rounded-full bg-neutral-900/80 py-1.5 pl-4 pr-1.5 text-sm text-white shadow-lg backdrop-blur-md">
        <MousePointerClick aria-hidden="true" className="size-4 shrink-0" />
        <p className="min-w-0 truncate">
          Pick the day <span className="font-medium">{text}</span>{" "}
          {field === "start" ? "started" : "finished"}
        </p>
        <button
          className="shrink-0 rounded-full px-2.5 py-1 text-neutral-300 outline-none transition-colors hover:bg-white/10 hover:text-white"
          onClick={stopPickingDate}
          type="button"
        >
          Cancel
          <span className="ml-1.5 text-xs text-neutral-400">Esc</span>
        </button>
      </div>
    </div>
  )
}
