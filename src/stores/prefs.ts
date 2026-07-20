import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PrefsState {
  /** Play a soft chime on celebrations. Off by default — opt-in via Settings. */
  sound: boolean
  setSound: (on: boolean) => void
  toggleSound: () => void
}

/** Small, persisted user preferences that aren't server-backed. */
export const usePrefsStore = create<PrefsState>()(
  persist(
    (set, get) => ({
      sound: false,
      setSound: (sound) => set({ sound }),
      toggleSound: () => set({ sound: !get().sound }),
    }),
    { name: 'almanac-prefs' },
  ),
)
