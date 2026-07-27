import { Plus } from "lucide-react"
import { useDb } from "../../store/hooks"
import { createMilestone } from "../../store/operations/milestones"
import { ContextMenu, ContextMenuItem } from "../../ui/context-menu"
import PaneHeader from "../../ui/pane-header"
import ToolbarButton from "../../ui/toolbar-button"
import MilestoneList from "../milestone-list/milestone-list"

export default function MilestoneListPane() {
  const db = useDb()

  const handleNewMilestone = () => {
    createMilestone(db)
  }

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col bg-white">
      <PaneHeader>
        {/* px-3 matches the row card's own padding, so the title lines up
            with the color dots below it. mr-auto puts the button on the
            pane's right edge. */}
        <h1 className="mr-auto px-3 text-xl font-semibold tracking-tight">
          Milestones
        </h1>
        <ToolbarButton onClick={handleNewMilestone}>
          <Plus aria-hidden="true" className="size-4" />
          New milestone
        </ToolbarButton>
      </PaneHeader>
      <ContextMenu
        trigger={
          <div className="flex min-h-0 flex-1 flex-col">
            <MilestoneList />
          </div>
        }
      >
        <ContextMenuItem onClick={handleNewMilestone}>
          New milestone
        </ContextMenuItem>
      </ContextMenu>
    </section>
  )
}
