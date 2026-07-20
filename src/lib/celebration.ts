import { haptic } from '@/lib/haptics'

/**
 * The one path every "moment" goes through — Perfect Day, achievement unlock,
 * a new PR. Centralising it keeps celebrations consistent and tasteful instead
 * of scattered one-offs.
 *
 * Phase 1 wires the seam and the haptic. Phase 3 grows this into a store + a
 * portal host that also fires accent-scheme confetti, an optional terminal
 * chime, and (for the big ones) a modal — without call sites having to change.
 */
export type CelebrationKind = 'perfect-day' | 'achievement' | 'pr' | 'milestone'

export function celebrate(kind: CelebrationKind): void {
  haptic(kind === 'milestone' ? 'medium' : 'success')
  // Phase 3: visual burst + sound + modal dispatched from here.
}
