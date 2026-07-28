// What a pointer event landed on, as the nearest enclosing element matching a
// selector — the list asks whether a press was inside a row, the calendar asks
// which day a right-click was over.
//
// An event target is not necessarily an element (a window, a document, a text
// node), so the question has to be allowed to have no answer. That is the
// whole reason this exists: the alternative at each call site is casting the
// target and hoping, which is a crash rather than a miss when it is wrong.
export function closestElement(
  target: EventTarget | null,
  selector: string,
): Element | undefined {
  return target instanceof Element
    ? (target.closest(selector) ?? undefined)
    : undefined
}
