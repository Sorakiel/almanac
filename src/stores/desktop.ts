import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Desktop-only, device-local preferences (not synced to the profile — this is a
 * per-machine choice). `runInBackground` keeps Almanac alive in the tray after
 * the window is closed so the daily reminder can still fire; turning it off makes
 * closing the window a full quit, at the cost of background notifications.
 */
interface DesktopState {
  runInBackground: boolean
  setRunInBackground: (value: boolean) => void
}

export const useDesktopStore = create<DesktopState>()(
  persist(
    (set) => ({
      runInBackground: true,
      setRunInBackground: (value) => set({ runInBackground: value }),
    }),
    { name: 'almanac.desktop' },
  ),
)
