import type { ButtonHTMLAttributes } from "react"

export default function ToolbarButton(
  props: ButtonHTMLAttributes<HTMLButtonElement>,
) {
  return (
    <button
      className="flex items-center gap-2 rounded-md border border-transparent px-2 py-1.5 font-medium text-neutral-500 outline-none transition enabled:hover:border-neutral-950/10 enabled:active:border-transparent enabled:active:bg-neutral-950/5 disabled:text-neutral-300"
      type="button"
      {...props}
    />
  )
}
