import type { ButtonHTMLAttributes } from "react"

export default function ToolbarButton(
  props: ButtonHTMLAttributes<HTMLButtonElement>,
) {
  return (
    <button
      // White on the header's faint grey, which is what makes it read as a
      // control sitting on the bar rather than a word printed on it.
      className="flex items-center gap-2 rounded-md border border-neutral-950/10 bg-white px-2.5 py-1.5 text-sm font-medium text-neutral-600 shadow-xs outline-none transition enabled:hover:bg-neutral-50 enabled:hover:text-neutral-900 enabled:active:bg-neutral-100 disabled:text-neutral-300"
      type="button"
      {...props}
    />
  )
}
