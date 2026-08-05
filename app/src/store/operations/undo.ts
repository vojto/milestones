import type { Db } from "../hooks"

// Undo is TinyBase checkpoints. Apart from store-provider.tsx, which creates
// them, this module is the only place that touches them: a step is defined by
// when the app seals one, so scattering addCheckpoint calls through the app
// would be scattering the definition of an undo step.
//
// It stays this short because the store holds only the document. The
// selection, the rename in flight and the year on screen live in ../ui-store,
// so a checkpoint cannot contain them, and undo has nothing to do but move.

// One user action, one step.
export function asUndoStep(db: Db, label: string, mutate: () => void) {
  db.store.transaction(mutate)
  db.checkpoints.addCheckpoint(label)
}

// For a gesture that commits as it goes: the drag reorders with the building
// blocks and seals them as one step when it lands. TinyBase ignores this when
// nothing changed, so a drag that went nowhere adds nothing to undo.
export function sealUndoStep(db: Db, label: string) {
  db.checkpoints.addCheckpoint(label)
}

// Where a gesture should return to if it is abandoned — read at drag start,
// passed to revertTo on cancel.
export function currentCheckpoint(db: Db): string | undefined {
  return db.checkpoints.getCheckpointIds()[1]
}

// Throws away the changes a gesture made rather than recording them: goTo
// seals the abandoned changes into a forward (redo) checkpoint, so clearing
// forward is what keeps redo from re-applying a canceled drag.
export function revertTo(db: Db, checkpointId: string) {
  db.checkpoints.goTo(checkpointId)
  db.checkpoints.clearForward()
}

export function undo(db: Db) {
  db.checkpoints.goBackward()
}

export function redo(db: Db) {
  db.checkpoints.goForward()
}
