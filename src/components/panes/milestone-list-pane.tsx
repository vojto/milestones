import { Plus } from "lucide-react"
import { useDb } from "../../store/hooks"
import { createMilestone } from "../../store/operations/milestones"
import { ContextMenu, ContextMenuItem } from "../../ui/context-menu"
import ToolbarButton from "../../ui/toolbar-button"
import MilestoneList from "../milestone-list/milestone-list"

export default function MilestoneListPane() {
  const db = useDb()

  const handleNewMilestone = () => {
    createMilestone(db)
  }

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col bg-white">
      <ContextMenu
        trigger={
          <div className="flex min-h-0 flex-1 flex-col">
            <MilestoneList
              header={
                // px-3 matches the row card's own padding, so the title lines
                // up with the color dots below it.
                <header className="mb-8 px-3">
                  <h1 className="text-2xl font-semibold tracking-tight">
                    Milestones
                  </h1>
                </header>
              }
            />
          </div>
        }
      >
        <ContextMenuItem onClick={handleNewMilestone}>
          New milestone
        </ContextMenuItem>
      </ContextMenu>

      <footer className="h-12 shrink-0 border-t border-neutral-200 p-2">
        <ToolbarButton onClick={handleNewMilestone}>
          <Plus aria-hidden="true" className="size-4" />
          New milestone
        </ToolbarButton>
      </footer>
    </section>
  )
}
