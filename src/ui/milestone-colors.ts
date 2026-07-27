// The palette a milestone is dressed in. Ten hues far enough apart to tell
// each other apart at the size of a calendar day, in spectrum order so a list
// of milestones created one after another reads as a gradient rather than a
// scramble.
//
// The classes are written out in full rather than composed from the hue,
// because Tailwind finds classes by scanning source text — a name built at
// runtime would produce no CSS at all.

export interface MilestoneColor {
  // The calendar day's fill, and the number sitting on it. A mid tone with a
  // near-black number, so a month of colored days stays a calendar you can
  // read dates off rather than a block of paint.
  dayClass: string
  dayTextClass: string
  // The dot at the head of the milestone's row, the one thing tying the row
  // to its band in the calendar. Deeper than the fill: it is small, and a
  // 300-level dot on white all but disappears.
  dotClass: string
  // What the milestone's dates are printed in while it is still running.
  textClass: string
  name: string
}

// The keys land in the `color` cell, so renaming one orphans every milestone
// already wearing it; add and retire keys instead.
const COLORS = {
  rose: {
    dayClass: "bg-rose-300",
    dayTextClass: "text-rose-950",
    dotClass: "bg-rose-500",
    textClass: "text-rose-600",
    name: "Rose",
  },
  orange: {
    dayClass: "bg-orange-300",
    dayTextClass: "text-orange-950",
    dotClass: "bg-orange-500",
    textClass: "text-orange-600",
    name: "Orange",
  },
  amber: {
    dayClass: "bg-amber-300",
    dayTextClass: "text-amber-950",
    dotClass: "bg-amber-500",
    textClass: "text-amber-600",
    name: "Amber",
  },
  lime: {
    dayClass: "bg-lime-300",
    dayTextClass: "text-lime-950",
    dotClass: "bg-lime-500",
    textClass: "text-lime-600",
    name: "Lime",
  },
  emerald: {
    dayClass: "bg-emerald-300",
    dayTextClass: "text-emerald-950",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-600",
    name: "Emerald",
  },
  teal: {
    dayClass: "bg-teal-300",
    dayTextClass: "text-teal-950",
    dotClass: "bg-teal-500",
    textClass: "text-teal-600",
    name: "Teal",
  },
  sky: {
    dayClass: "bg-sky-300",
    dayTextClass: "text-sky-950",
    dotClass: "bg-sky-500",
    textClass: "text-sky-600",
    name: "Sky",
  },
  indigo: {
    dayClass: "bg-indigo-300",
    dayTextClass: "text-indigo-950",
    dotClass: "bg-indigo-500",
    textClass: "text-indigo-600",
    name: "Indigo",
  },
  violet: {
    dayClass: "bg-violet-300",
    dayTextClass: "text-violet-950",
    dotClass: "bg-violet-500",
    textClass: "text-violet-600",
    name: "Violet",
  },
  fuchsia: {
    dayClass: "bg-fuchsia-300",
    dayTextClass: "text-fuchsia-950",
    dotClass: "bg-fuchsia-500",
    textClass: "text-fuchsia-600",
    name: "Fuchsia",
  },
} satisfies Record<string, MilestoneColor>

export const MILESTONE_COLOR_KEYS: readonly string[] = Object.keys(COLORS)

// The same table for reading, keyed by anything: a `color` cell holds whatever
// some version of the app once wrote there, so a lookup has to be allowed to
// miss.
export const MILESTONE_COLORS: Record<string, MilestoneColor> = COLORS

const FALLBACK_COLOR: MilestoneColor = {
  dayClass: "bg-neutral-300",
  dayTextClass: "text-neutral-900",
  dotClass: "bg-neutral-400",
  textClass: "text-neutral-500",
  name: "Grey",
}

// Which color a milestone is actually wearing: absent and unrecognized
// resolve in one place, so no caller re-derives the fallback.
export function milestoneColor(colorKey: string | undefined): MilestoneColor {
  return MILESTONE_COLORS[colorKey ?? ""] ?? FALLBACK_COLOR
}

// The color a new milestone gets: the first one nobody is using, so a handful
// of milestones are always all different. Once the palette is spent it wraps
// around — repeating a hue is better than running out of them.
export function nextColorKey(takenKeys: readonly string[]): string {
  const free = MILESTONE_COLOR_KEYS.find((key) => !takenKeys.includes(key))
  return (
    free ??
    MILESTONE_COLOR_KEYS[takenKeys.length % MILESTONE_COLOR_KEYS.length] ??
    "rose"
  )
}
