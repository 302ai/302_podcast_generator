import { produce } from 'immer'
import { create } from 'zustand'

import { storeMiddleware } from './middleware'

interface UserStore {
  _hasHydrated: boolean
  language?: string
}

interface UserActions {
  updateField: <T extends keyof UserStore>(
    field: T,
    value: UserStore[T]
  ) => void
  updateAll: (fields: Partial<UserStore>) => void
  setHasHydrated: (value: boolean) => void
}

export const useUserStore = create<UserStore & UserActions>()(
  storeMiddleware<UserStore & UserActions>(
    (set) => ({
      _hasHydrated: false,
      language: 'en',
      updateField: (field, value) =>
        set(
          produce((state) => {
            state[field] = value
          })
        ),
      updateAll: (fields) =>
        set(
          produce((state) => {
            for (const [key, value] of Object.entries(fields)) {
              state[key as keyof UserStore] = value
            }
          })
        ),
      setHasHydrated: (value) =>
        set(
          produce((state) => {
            state._hasHydrated = value
          })
        ),
    }),
    'user_store_podcast'
  )
)
