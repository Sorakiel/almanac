import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PrefsState {
  /** Play a soft chime on celebrations. Off by default — opt-in via Settings. */
  sound: boolean
  setSound: (on: boolean) => void
  toggleSound: () => void
  /**
   * Send anonymous usage events. On by default — the app is shared with a
   * handful of friends and the owner needs to know which modules are actually
   * used — but it is one toggle away in Settings, and Do Not Track wins
   * regardless of what is stored here.
   */
  analytics: boolean
  setAnalytics: (on: boolean) => void
}

/** Small, persisted user preferences that aren't server-backed. */
export const usePrefsStore = create<PrefsState>()(
  persist(
    (set, get) => ({
      sound: false,
      setSound: (sound) => set({ sound }),
      toggleSound: () => set({ sound: !get().sound }),
      analytics: true,
      setAnalytics: (analytics) => set({ analytics }),
    }),
    { name: 'almanac-prefs' },
  ),
)
