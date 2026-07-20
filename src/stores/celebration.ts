import type { ComponentType } from 'react'

import { create } from 'zustand'

export type CelebrationKind = 'perfect-day' | 'achievement' | 'pr' | 'milestone'

export interface CelebrationPayload {
  kind: CelebrationKind
  /** Headline for the modal / burst caption. */
  title: string
  /** Supporting line, shown in the modal. */
  message?: string
  /** Badge glyph for the modal (e.g. the unlocked achievement's icon). */
  icon?: ComponentType<{ className?: string }>
  /**
   * A full centered modal (achievement unlocks). Otherwise a lightweight
   * top-of-screen confetti burst that auto-clears.
   */
  modal?: boolean
}

interface CelebrationState {
  active: CelebrationPayload | null
  /** A token that changes on every show, so the host can re-run its burst. */
  token: number
  show: (payload: CelebrationPayload) => void
  dismiss: () => void
}

/**
 * Visual state for the one celebration on screen. The `celebrate()` helper in
 * lib/celebration drives this (plus haptics + sound); <CelebrationHost> renders
 * it. Kept as a single active slot — celebrations are rare and one-at-a-time.
 */
export const useCelebrationStore = create<CelebrationState>((set, get) => ({
  active: null,
  token: 0,
  show: (payload) => set({ active: payload, token: get().token + 1 }),
  dismiss: () => set({ active: null }),
}))
