import { Menu } from "@tauri-apps/api/menu"
import type {
  CheckMenuItemOptions,
  MenuItemOptions,
  PredefinedMenuItemOptions,
  SubmenuOptions,
} from "@tauri-apps/api/menu"
import type { MouseEvent } from "react"

// Context menus are the host's. Right-clicking builds a real macOS menu and
// pops it where the pointer is, so it wears the system's own metrics and
// behaves like every other menu on the machine — the same arrangement as the
// menu bar next door in ./app-menu, which is also described in JavaScript and
// built by the host.
//
// Everything that has a menu describes it as data (see
// components/milestone-list/milestone-row-menu) and hands the description to
// one handler, so a right-click means the same thing wherever it lands and
// only this module knows the description ends up in @tauri-apps/api/menu.

// A command, a submenu of them, or the rule between two groups. `isChecked`
// makes a command one of a set — the palette is the only such set, and the
// checkmark is how a native menu says which one is on.
export type ContextMenuItem =
  | "separator"
  | { label: string; isChecked?: boolean; run: () => void }
  | { label: string; items: ContextMenuItem[] }

// The right-click handler for anything with a menu. The description is built
// at click time rather than at render, so the items are the answer for the
// milestone as it is now and a menu costs nothing until it is asked for.
//
// A right-click that opens a menu is spoken for: the webview's own menu is
// suppressed, and the event stops so it does not also reach whatever is
// behind — the list pane draws a menu behind every row. A description that
// comes back empty, which is what a right-click on the gap between two months
// gets, claims nothing and is left to bubble.
export function contextMenuHandler(
  describe: (event: MouseEvent) => ContextMenuItem[],
) {
  return (event: MouseEvent) => {
    const items = describe(event)
    if (items.length === 0) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    void showContextMenu(items)
  }
}

// The menu popped last, kept until the next one replaces it. Each menu is a
// resource on the host side and popping does not wait for the user to dismiss
// it, so closing one on the line after popping it would close it while it is
// still on screen. Closing it when the next right-click arrives is late enough
// to be safe and early enough that a session's worth of menus does not pile
// up: one outlives its use, not hundreds.
let lastMenu: Menu | undefined

async function showContextMenu(items: ContextMenuItem[]) {
  const menu = await Menu.new({ items: items.map(menuItemOptions) })
  void lastMenu?.close()
  lastMenu = menu
  await menu.popup()
}

type ItemOptions =
  | CheckMenuItemOptions
  | MenuItemOptions
  | PredefinedMenuItemOptions
  | SubmenuOptions

function menuItemOptions(item: ContextMenuItem): ItemOptions {
  if (item === "separator") {
    return { item: "Separator" }
  }
  if ("items" in item) {
    return { text: item.label, items: item.items.map(menuItemOptions) }
  }
  // The presence of `checked` is what makes the host build a check item, so an
  // item that is not one of a set must not carry the key at all — passing
  // `checked: false` would give every ordinary command an empty checkmark
  // column.
  return item.isChecked === undefined
    ? { text: item.label, action: item.run }
    : { text: item.label, checked: item.isChecked, action: item.run }
}
