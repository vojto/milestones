import { DragDropProvider } from "@dnd-kit/react"
import CalendarPane from "../components/panes/calendar-pane"
import MilestoneListPane from "../components/panes/milestone-list-pane"
import { useMilestoneDnd } from "../components/milestone-list/use-milestone-dnd"
import { useKeyboard } from "../keyboard/use-keyboard"
import { useAppMenu } from "../platform/app-menu"
import { useDesktopChrome } from "../platform/use-desktop-chrome"
import PaneSeparator from "../ui/pane-separator"
import { usePaneWidths } from "./use-pane-widths"

// Two panes: the year on the left, the milestones that shaped it on the right.
// Neither is a detail view of the other — they are the same facts read two
// ways, which is why nothing here ever swaps a pane out.
export default function MainScreen() {
  const { gridTemplateColumns, resizeList } = usePaneWidths()
  const { handleDrag, handleDragEnd, handleDragStart } = useMilestoneDnd()
  useKeyboard()
  useAppMenu()
  useDesktopChrome()

  return (
    <DragDropProvider
      onDragStart={handleDragStart}
      onDragMove={handleDrag}
      onDragOver={handleDrag}
      onDragEnd={handleDragEnd}
    >
      {/* The top border is the seam under the window's title bar: without it
          the native chrome runs straight into white and the window looks like
          it has lost its top edge. */}
      <main
        className="grid h-dvh w-screen overflow-hidden border-t border-neutral-200 bg-white"
        style={{ gridTemplateColumns }}
      >
        <CalendarPane />
        <PaneSeparator label="Resize milestone list" onResize={resizeList} />
        <MilestoneListPane />
      </main>
    </DragDropProvider>
  )
}
