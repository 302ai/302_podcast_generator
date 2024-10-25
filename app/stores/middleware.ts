import type { StateCreator } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'

interface WithHydratedState {
  setHasHydrated: (hasHydrated: boolean) => void
}

export const storeMiddleware = <T extends WithHydratedState>(
  f: StateCreator<T, [], [['zustand/devtools', T], ['zustand/persist', T]]>,
  name: string
) =>
  devtools(
    persist(f, {
      name,
      storage: createJSONStorage(() => sessionStorage),
      onRehydrateStorage: (state) => {
        return () => state.setHasHydrated(true)
      },
    }),
    { enabled: false }
  )
