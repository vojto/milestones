import type { ContextMenuItem } from "../../platform/context-menu"
import type { Db } from "../../store/hooks"
import { setMilestoneColor } from "../../store/operations/milestones"
import type { MilestoneId } from "../../store/schema"
import { MILESTONE_COLORS, milestoneColorKey } from "../../ui/milestone-colors"

// The row menu's color submenu: the whole palette as one-of-many, with a
// checkmark on the one the milestone is wearing. Its own module so the row's
// menu stays a short list of what a milestone can do.
export function milestoneColorMenu(
  db: Db,
  milestoneId: MilestoneId,
): ContextMenuItem {
  const colorKey = milestoneColorKey(
    db.store.getCell("milestones", milestoneId, "color"),
  )

  return {
    label: "Color",
    items: Object.entries(MILESTONE_COLORS).map(([key, { name }]) => ({
      label: name,
      isChecked: key === colorKey,
      run: () => {
        setMilestoneColor(db, milestoneId, key)
      },
    })),
  }
}
