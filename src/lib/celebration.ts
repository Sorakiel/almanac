import { haptic } from '@/lib/haptics'
import { playChime } from '@/lib/sound'
import { useCelebrationStore, type CelebrationPayload } from '@/stores/celebration'

/**
 * The one path every "moment" goes through — Perfect Day, a streak milestone,
 * an achievement unlock, a new PR. Centralising it keeps celebrations
 * consistent: the same haptic, the same optional chime, the same accent-scheme
 * confetti, without call sites having to wire any of it.
 */
export function celebrate(payload: CelebrationPayload): void {
  haptic(payload.kind === 'milestone' ? 'medium' : 'success')
  playChime(payload.kind)
  useCelebrationStore.getState().show(payload)
}
