import { useCell, useDb } from "../../store/hooks"
import { setMilestoneColor } from "../../store/operations/milestones"
import type { MilestoneId } from "../../store/schema"
import {
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSubmenu,
} from "../../ui/context-menu"
import { MILESTONE_COLORS, milestoneColor } from "../../ui/milestone-colors"

// The row menu's color submenu: the whole palette as one-of-many, each option
// wearing the color it names — the name alone would make you guess, and a
// milestone's color is the only thing tying its row to its band in the
// calendar. Its own component so the row's menu stays a short list of what a
// milestone can do.
export default function MilestoneColorMenu({
  milestoneId,
}: {
  milestoneId: MilestoneId
}) {
  const db = useDb()
  const colorKey = useCell("milestones", milestoneId, "color")

  return (
    <ContextMenuSubmenu label="Color">
      <ContextMenuRadioGroup
        onValueChange={(nextColorKey) => {
          setMilestoneColor(db, milestoneId, nextColorKey)
        }}
        // Resolving here rather than passing the raw cell keeps the checkmark
        // on a real option when the stored key is one this version retired.
        value={
          MILESTONE_COLORS[colorKey ?? ""] === undefined ? "" : (colorKey ?? "")
        }
      >
        {Object.entries(MILESTONE_COLORS).map(([key, { name }]) => (
          <ContextMenuRadioItem key={key} value={key}>
            <span className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={`size-2.5 rounded-full ${milestoneColor(key).dotClass}`}
              />
              {name}
            </span>
          </ContextMenuRadioItem>
        ))}
      </ContextMenuRadioGroup>
    </ContextMenuSubmenu>
  )
}
