import type { ReactNode } from "react"
import { dayCount, formatDay, yearOf } from "../../dates/day"
import { useToday } from "../../hooks/use-today"
import { useCell } from "../../store/hooks"
import { paintedRange } from "../../store/milestone-span"
import type { MilestoneId } from "../../store/schema"
import { displayName, MILESTONE_PLACEHOLDER_NAME } from "../../ui/display-name"
import { milestoneColor } from "../../ui/milestone-colors"

// The row's visual card. It reads by id, so every rendering stays in sync.
// Children replace the name label (the edit input slots in here) so the row
// keeps identical dimensions in both modes.
export default function MilestoneRowCard({
  children,
  isEditing = false,
  isSelected = false,
  milestoneId,
}: {
  children?: ReactNode
  isEditing?: boolean
  isSelected?: boolean
  milestoneId: MilestoneId
}) {
  const name = useCell("milestones", milestoneId, "name")
  const color = milestoneColor(useCell("milestones", milestoneId, "color"))

  if (name === undefined) {
    return null
  }

  const { isPlaceholder, text } = displayName(name, MILESTONE_PLACEHOLDER_NAME)

  // The transition class rides along only in the editing state, so entering
  // edit mode animates but selection changes snap. It's scoped to
  // color/shadow — transitioning transform would fight the FLIP reorder
  // animation.
  const cardClass = isEditing
    ? "bg-white shadow-md transition-[background-color,box-shadow] duration-300"
    : isSelected
      ? "bg-neutral-100"
      : ""

  return (
    <div
      className={`flex cursor-default select-none items-center gap-3 rounded-lg px-3 py-2 ${cardClass}`}
    >
      {/* The one thing tying this row to its band in the calendar. */}
      <span
        aria-hidden="true"
        className={`size-2.5 shrink-0 rounded-full ${color.dotClass}`}
      />
      {children ?? (
        <span
          className={`min-w-0 flex-1 truncate ${
            isPlaceholder ? "text-neutral-400" : "text-neutral-800"
          }`}
        >
          {text}
        </span>
      )}
      {/* Last in both modes: the rename input replaces the name, which is
          what pushes the dates to the edge, so they stay put while typing. */}
      <MilestoneSchedule milestoneId={milestoneId} />
    </div>
  )
}

// When the milestone ran, in the fewest words that still say which of the
// three states it is in: never started, running, or over. A running milestone
// prints in its own color and ends in "now" — the two things that make it read
// as the live one rather than one more finished stretch.
function MilestoneSchedule({ milestoneId }: { milestoneId: MilestoneId }) {
  const startedAt = useCell("milestones", milestoneId, "startedAt")
  const finishedAt = useCell("milestones", milestoneId, "finishedAt")
  const color = milestoneColor(useCell("milestones", milestoneId, "color"))
  const today = useToday()
  const range = paintedRange(startedAt, finishedAt, today)

  if (startedAt === undefined) {
    return (
      <span className="shrink-0 text-xs text-neutral-300">Not scheduled</span>
    )
  }

  // The calendar next to the list already says which year it is, so the dates
  // only spell one out when they fall outside it.
  const contextYear = yearOf(startedAt)
  const isRunning = finishedAt === undefined
  const end = isRunning ? "now" : formatDay(finishedAt, contextYear)

  return (
    <>
      <span
        className={`shrink-0 text-xs ${isRunning ? color.textClass : "text-neutral-400"}`}
      >
        {formatDay(startedAt, contextYear)} – {end}
      </span>
      {/* A fixed column, so the day counts line up down the list instead of
          drifting with the length of the dates beside them. */}
      <span className="w-9 shrink-0 text-right text-xs tabular-nums text-neutral-300">
        {range === undefined ? "" : `${dayCount(range.from, range.to)}d`}
      </span>
    </>
  )
}
