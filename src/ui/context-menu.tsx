import { ContextMenu as BaseContextMenu } from "@base-ui/react/context-menu"
import { Check, ChevronRight } from "lucide-react"
import type { ReactElement, ReactNode } from "react"

// Styled wrapper over Base UI's context menu; each entity composes its own
// items. The popup appears instantly (no data-starting-style rule) but fades
// out — the opacity transition only kicks in when data-ending-style applies
// during close.

// Shared by the menu and its submenus, which are the same surface at
// different depths.
const POPUP_CLASS =
  "min-w-40 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg outline-none transition-opacity duration-150 data-[ending-style]:opacity-0"

// Every row here is the same shape: full-width, one text size, grey when the
// pointer or the keyboard is on it.
const ITEM_CLASS =
  "mx-1 cursor-default select-none rounded-md px-2.5 py-1.5 text-sm outline-none"

// Left uncontrolled — no `isOpen` — the menu opens wherever it was
// right-clicked and closes itself, which is all a menu belonging to one entity
// needs. Passing the pair makes it controlled instead, for a trigger covering
// many things at once: the calendar spans a whole year with one menu, and
// which day it is for (or that it is for no day at all) is decided by the
// right-click rather than by which element caught it.
export function ContextMenu({
  children,
  isOpen,
  onOpenChange,
  trigger,
}: {
  children: ReactNode
  isOpen?: boolean
  onOpenChange?: (isOpen: boolean) => void
  trigger: ReactElement<Record<string, unknown>>
}) {
  return (
    <BaseContextMenu.Root onOpenChange={onOpenChange} open={isOpen}>
      <BaseContextMenu.Trigger render={trigger} />
      <BaseContextMenu.Portal>
        <BaseContextMenu.Positioner className="z-50 outline-none">
          <BaseContextMenu.Popup className={POPUP_CLASS}>
            {children}
          </BaseContextMenu.Popup>
        </BaseContextMenu.Positioner>
      </BaseContextMenu.Portal>
    </BaseContextMenu.Root>
  )
}

export function ContextMenuItem({
  children,
  danger = false,
  onClick,
}: {
  children: ReactNode
  danger?: boolean
  onClick: () => void
}) {
  const toneClass = danger
    ? "text-red-600 data-[highlighted]:bg-red-50"
    : "text-neutral-700 data-[highlighted]:bg-neutral-100"

  return (
    <BaseContextMenu.Item
      className={`${ITEM_CLASS} ${toneClass}`}
      onClick={onClick}
    >
      {children}
    </BaseContextMenu.Item>
  )
}

// Groups a menu into what it can do now versus what it can do to itself. The
// margins are the item margins, so the line spans the same width the labels
// do rather than the popup's padding.
export function ContextMenuSeparator() {
  return <BaseContextMenu.Separator className="mx-1 my-1 h-px bg-neutral-200" />
}

// An item that opens a menu of its own. It stays grey while its submenu is
// open (data-popup-open), so it's clear which row the second menu belongs to.
export function ContextMenuSubmenu({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) {
  return (
    <BaseContextMenu.SubmenuRoot>
      <BaseContextMenu.SubmenuTrigger
        className={`${ITEM_CLASS} flex items-center justify-between gap-6 text-neutral-700 data-[highlighted]:bg-neutral-100 data-[popup-open]:bg-neutral-100`}
      >
        {label}
        <ChevronRight
          aria-hidden="true"
          className="size-3.5 text-neutral-400"
        />
      </BaseContextMenu.SubmenuTrigger>
      <BaseContextMenu.Portal>
        <BaseContextMenu.Positioner
          alignOffset={-4}
          className="z-50 outline-none"
          sideOffset={2}
        >
          <BaseContextMenu.Popup className={POPUP_CLASS}>
            {children}
          </BaseContextMenu.Popup>
        </BaseContextMenu.Positioner>
      </BaseContextMenu.Portal>
    </BaseContextMenu.SubmenuRoot>
  )
}

// One-of-many choices. Base UI types the value as `any`, which these two
// narrow to string on the way through so no caller has to.
export function ContextMenuRadioGroup({
  children,
  onValueChange,
  value,
}: {
  children: ReactNode
  onValueChange: (value: string) => void
  value: string
}) {
  return (
    <BaseContextMenu.RadioGroup
      onValueChange={(nextValue: unknown) => {
        if (typeof nextValue === "string") {
          onValueChange(nextValue)
        }
      }}
      value={value}
    >
      {children}
    </BaseContextMenu.RadioGroup>
  )
}

// The checkmark keeps its column whether or not it is showing, so the labels
// line up and choosing a different one doesn't shift the menu.
export function ContextMenuRadioItem({
  children,
  value,
}: {
  children: ReactNode
  value: string
}) {
  return (
    <BaseContextMenu.RadioItem
      className={`${ITEM_CLASS} flex items-center gap-2 pl-2 text-neutral-700 data-[highlighted]:bg-neutral-100`}
      closeOnClick
      value={value}
    >
      <span className="w-3.5 shrink-0">
        <BaseContextMenu.RadioItemIndicator>
          <Check aria-hidden="true" className="size-3.5" />
        </BaseContextMenu.RadioItemIndicator>
      </span>
      {children}
    </BaseContextMenu.RadioItem>
  )
}
