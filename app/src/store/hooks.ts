import * as UiReactModule from "tinybase/ui-react/with-schemas"
import type { Checkpoints } from "tinybase/checkpoints/with-schemas"
import type { Store } from "tinybase/with-schemas"
import type { Schemas } from "./schema"

// The single schema-typed cast (the documented TinyBase pattern); everything
// else in the app imports its hooks from here.
const UiReact = UiReactModule as unknown as UiReactModule.WithSchemas<Schemas>

// Readers, plus the setup hooks the provider needs. TinyBase's row/cell
// writing hooks are deliberately not re-exported: every table mutation goes
// through src/store/operations, so components have no way to reach for one.
// Nor are the value hooks — the document has no values (see schema.ts), and
// what would have been read through them lives in ./ui-store.
export const {
  Provider,
  useCell,
  useCheckpoints,
  useCreateCheckpoints,
  useCreatePersister,
  useCreateStore,
  useSortedRowIds,
  useStore,
  useTable,
} = UiReact

// The store and its checkpoints, bundled like a database connection for the
// operations in ./operations. Checkpoints belong here because undo is part of
// writing: an operation that changes data is also the thing that decides what
// one undo step contains (see ./operations/undo).
export interface Db {
  store: Store<Schemas>
  checkpoints: Checkpoints<Schemas>
}

export function useDb(): Db {
  const store = useStore()
  const checkpoints = useCheckpoints()
  if (store === undefined || checkpoints === undefined) {
    throw new Error("useDb must be used inside StoreProvider")
  }
  return { store, checkpoints }
}
