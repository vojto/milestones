import { useCallback, useState } from "react"

// The text input a row swaps in while renaming. Edit mode is owned by the
// store, so this input mounts exactly when an edit starts; mounting is
// therefore the right moment to seed the draft and take focus. It owns the
// text and the rule for what is worth committing, leaving the row to decide
// what a commit means.
export default function InlineEditInput({
  className,
  initialValue,
  onCancel,
  onCommit,
}: {
  className?: string
  initialValue: string
  onCancel: () => void
  // Receives the trimmed draft, or undefined when it is empty or unchanged:
  // renaming to nothing is a no-op, so a row can stay unnamed.
  onCommit: (value: string | undefined) => void
}) {
  const [draft, setDraft] = useState(initialValue)
  // Stable identity so the ref only runs when the input mounts, not on every
  // keystroke re-render — the one place a useCallback earns its keep here.
  const initInput = useCallback((node: HTMLInputElement | null) => {
    if (node !== null) {
      node.focus()
      node.setSelectionRange(node.value.length, node.value.length)
    }
  }, [])

  const commit = () => {
    const trimmed = draft.trim()
    onCommit(trimmed === "" || trimmed === initialValue ? undefined : trimmed)
  }

  return (
    <input
      ref={initInput}
      className={className}
      onBlur={commit}
      onChange={(event) => {
        setDraft(event.target.value)
      }}
      // Keys stop here: the row behind the input reads Enter as "rename", and
      // its sortable's keyboard plugin would read these as drag input.
      onKeyDown={(event) => {
        event.stopPropagation()
        if (event.key === "Enter") {
          commit()
        } else if (event.key === "Escape") {
          onCancel()
        }
      }}
      value={draft}
    />
  )
}
