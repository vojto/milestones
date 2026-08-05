import { useEffect } from "react"

// The handful of places where a webview still behaves like a web page and a
// window should not.
//
// Right-click: where the app has a menu it pops a native one and claims the
// event (./context-menu). Anywhere else — the gaps between months, the pane
// headers — the webview would otherwise offer its own menu, full of things
// like Reload that do not belong to an app. Text fields keep theirs, because
// Cut/Copy/Paste on a selection is exactly right there.
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
