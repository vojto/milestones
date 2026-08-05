// A milestone can exist without a name: creating one adds the row immediately
// and leaves naming to the inline editor. Everything that renders a name runs
// it through here first, so the "not named yet" state looks the same in the
// list and in a menu label.

const PLACEHOLDER_NAME = "New Milestone"

export function displayName(name: string | undefined) {
  const isPlaceholder = (name ?? "").trim() === ""
  return {
    isPlaceholder,
    text: isPlaceholder ? PLACEHOLDER_NAME : (name ?? ""),
  }
}
