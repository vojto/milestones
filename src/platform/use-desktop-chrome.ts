import { useEffect } from "react"

// The handful of places where a webview still behaves like a web page and a
// window should not.
//
// Right-click: the app draws its own menus (ui/context-menu.tsx), and those
// call preventDefault where they open. Anywhere else — the calendar, the empty
// space below the list — the webview would otherwise offer its own menu, full
// of things like Reload that do not belong to an app. Text fields keep theirs,
// because Cut/Copy/Paste on a selection is exactly right there.
//
// Only in a built app: during development the native menu is how you reach
// Inspect Element.

function isTextField(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement)
  )
}

export function useDesktopChrome() {
  useEffect(() => {
    if (import.meta.env.DEV) {
      return
    }

    const handleContextMenu = (event: MouseEvent) => {
      if (!isTextField(event.target)) {
        event.preventDefault()
      }
    }

    window.addEventListener("contextmenu", handleContextMenu)
    return () => {
      window.removeEventListener("contextmenu", handleContextMenu)
    }
  }, [])
}
