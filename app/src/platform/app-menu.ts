import { Menu, MenuItem } from "@tauri-apps/api/menu"
import type {
  PredefinedMenuItemOptions,
  SubmenuOptions,
} from "@tauri-apps/api/menu"
import { useEffect } from "react"
import { useDb, type Db } from "../store/hooks"
import { createMilestone } from "../store/operations/milestones"
import { redo, undo } from "../store/operations/undo"
import { useUiStore } from "../store/ui-store"

// The menu bar. Its items call the same functions in src/store/operations that
// the toolbar and src/keyboard/use-keyboard call, so a command cannot mean one
// thing in the menu and another on the keyboard — the operations layer is
// still the only place that says what any of them do.
//
// The menu owns every command that carries a modifier; the window keymap keeps
// the bare keys (arrows, Enter, Escape, Delete) that would be wrong as
// accelerators, because an accelerator fires while you are typing a name.

// The application submenu, Services and Hide are macOS furniture. Elsewhere
// Quit joins the File menu instead and the bar is merely shorter.
const IS_MAC = navigator.userAgent.includes("Mac")

const APP_SUBMENU: SubmenuOptions = {
  text: "Milestones",
  items: [
    { item: { About: null } },
    { item: "Separator" },
    { item: "Services" },
    { item: "Separator" },
    { item: "Hide" },
    { item: "HideOthers" },
    { item: "ShowAll" },
    { item: "Separator" },
    { item: "Quit" },
  ],
}

const WINDOW_SUBMENU: SubmenuOptions = {
  text: "Window",
  items: [
    { item: "Minimize" },
    { item: "Maximize" },
    { item: "Separator" },
    { item: "Fullscreen" },
  ],
}

const QUIT_ITEM: PredefinedMenuItemOptions = { item: "Quit" }

// Undo is greyed out when there is nothing to undo, and also while a rename is
// in flight: inside a text field ⌘Z should undo typing, which is what the
// webview does with the keystroke when the menu item does not claim it.
//
// Both things this reads change far more often than the answer does — every
// arrow key moves the selection — and every setEnabled is a round trip to the
// host, so it sends only what actually changed.
function undoEnablement(db: Db): [canUndo: boolean, canRedo: boolean] {
  const [backward, , forward] = db.checkpoints.getCheckpointIds()
  const isRenaming = useUiStore.getState().editingMilestoneId !== undefined
  return [!isRenaming && backward.length > 0, !isRenaming && forward.length > 0]
}

async function installAppMenu(db: Db): Promise<() => void> {
  const undoItem = await MenuItem.new({
    text: "Undo",
    accelerator: "CmdOrCtrl+Z",
    enabled: false,
    action: () => {
      undo(db)
    },
  })
  const redoItem = await MenuItem.new({
    text: "Redo",
    accelerator: "Shift+CmdOrCtrl+Z",
    enabled: false,
    action: () => {
      redo(db)
    },
  })

  const fileSubmenu: SubmenuOptions = {
    text: "File",
    items: [
      {
        text: "New Milestone",
        accelerator: "CmdOrCtrl+N",
        action: () => {
          createMilestone(db)
        },
      },
      { item: "Separator" },
      { item: "CloseWindow" },
      ...(IS_MAC ? [] : [QUIT_ITEM]),
    ],
  }

  const editSubmenu: SubmenuOptions = {
    text: "Edit",
    items: [
      undoItem,
      redoItem,
      { item: "Separator" },
      // Not decoration: on macOS a text field only gets ⌘X/⌘C/⌘V/⌘A because
      // these items are in the menu, so the rename input depends on them.
      { item: "Cut" },
      { item: "Copy" },
      { item: "Paste" },
      { item: "SelectAll" },
    ],
  }

  const menu = await Menu.new({
    items: [
      ...(IS_MAC ? [APP_SUBMENU] : []),
      fileSubmenu,
      editSubmenu,
      WINDOW_SUBMENU,
    ],
  })
  await (IS_MAC ? menu.setAsAppMenu() : menu.setAsWindowMenu())

  let [wasUndoable, wasRedoable] = undoEnablement(db)
  void undoItem.setEnabled(wasUndoable)
  void redoItem.setEnabled(wasRedoable)

  const update = () => {
    const [canUndo, canRedo] = undoEnablement(db)
    if (canUndo !== wasUndoable) {
      wasUndoable = canUndo
      void undoItem.setEnabled(canUndo)
    }
    if (canRedo !== wasRedoable) {
      wasRedoable = canRedo
      void redoItem.setEnabled(canRedo)
    }
  }
  const listenerId = db.checkpoints.addCheckpointIdsListener(update)
  const unsubscribeUi = useUiStore.subscribe(update)

  return () => {
    db.checkpoints.delListener(listenerId)
    unsubscribeUi()
  }
}

export function useAppMenu() {
  const db = useDb()

  useEffect(() => {
    let uninstall: (() => void) | undefined
    let isCancelled = false

    void installAppMenu(db).then((teardown) => {
      if (isCancelled) {
        teardown()
      } else {
        uninstall = teardown
      }
    })

    return () => {
      isCancelled = true
      uninstall?.()
    }
  }, [db])
}
