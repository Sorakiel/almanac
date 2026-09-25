import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface BadgesState {
  /** A badge was unlocked that the user has not looked at yet. */
  unseen: boolean
  /** The achievement that unlocked last — the one medallion that glints. */
  newestId: string | null
  markUnseen: (achievementId: string) => void
  markSeen: () => void
}

/**
 * The "you have a new badge" dot on the profile entry points. Device-local,
 * like the seen-unlocks set it complements: it only means "not opened here".
 */
export const useBadgesStore = create<BadgesState>()(
  persist(
    (set) => ({
      unseen: false,
      newestId: null,
      markUnseen: (achievementId) => set({ unseen: true, newestId: achievementId }),
      markSeen: () => set({ unseen: false }),
    }),
    { name: 'almanac.badges' },
  ),
)
