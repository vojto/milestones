import { useToday } from "../../hooks/use-today"
import { useShownYear } from "../../hooks/use-milestone-ui"
import { useSortedRowIds, useTable } from "../../store/hooks"
import { runsThroughYear } from "../../store/milestone-span"
import type { MilestoneId } from "../../store/schema"

// The rows the list draws: the milestones that run through the year the
// calendar is showing, in the user's own order. The rule is
// runsThroughYear (see store/milestone-span), the same one the operations
// layer reads outside React through shownMilestoneIds — a list and a keystroke
// have to agree about which milestones are there.
//
// Whether the document is empty is a different question from whether this year
// is, and the list says different things about them, so it answers both.
export function useShownMilestones(): {
  milestoneIds: MilestoneId[]
  hasAnyMilestones: boolean
} {
  const year = useShownYear()
  const today = useToday()
  const sortedIds = useSortedRowIds("milestones", "position")
  const milestones = useTable("milestones")

  return {
    milestoneIds: sortedIds.filter((milestoneId) => {
      const milestone = milestones[milestoneId]
      return (
        milestone !== undefined &&
        runsThroughYear(milestone.startedAt, milestone.finishedAt, today, year)
      )
    }),
    hasAnyMilestones: sortedIds.length > 0,
  }
}
