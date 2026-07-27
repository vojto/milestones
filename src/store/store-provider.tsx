import { useState, type ReactNode } from "react"
import { createCheckpoints } from "tinybase/checkpoints/with-schemas"
import { createDocumentPersister } from "../platform/document-persister"
import {
  Provider,
  useCreateCheckpoints,
  useCreatePersister,
  useCreateStore,
} from "./hooks"
import { createAppStore, INITIAL_CONTENT } from "./schema"

// Creates the store and its persistence, and provides them to the app.
// Children render only once persisted data has loaded — loading must finish
// before auto-save starts so in-memory defaults never overwrite persisted
// data.
export default function StoreProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false)
  const store = useCreateStore(createAppStore)
  const checkpoints = useCreateCheckpoints(store, createCheckpoints)

  useCreatePersister(
    store,
    (persistedStore) => createDocumentPersister(persistedStore),
    [],
    async (persister) => {
      await persister.load(INITIAL_CONTENT)
      // The checkpoints object was created against an empty store, so loading
      // the document reads as a change one could undo — undo far enough and
      // the app would empty itself. Clearing makes the loaded document the
      // baseline, which is what "nothing to undo yet" means on a fresh start.
      checkpoints?.clear()
      await persister.startAutoSave()
      setIsReady(true)
    },
    [checkpoints],
  )

  return (
    <Provider checkpoints={checkpoints} store={store}>
      {isReady ? children : null}
    </Provider>
  )
}
