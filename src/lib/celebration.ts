import { haptic } from '@/lib/platform/haptics'
import { playChime } from '@/lib/platform/sound'
import { useCelebrationStore, type CelebrationPayload } from '@/stores/celebration'

/**
 * The path a full-screen moment goes through — today, only the perfect-day
 * seal: the haptic, the optional chime and the seal itself, without call sites
 * wiring any of it. Smaller moments (milestones, badges) are toasts.
 */
export function celebrate(payload: CelebrationPayload): void {
  haptic(payload.kind === 'milestone' ? 'medium' : 'success')
  playChime(payload.kind)
  useCelebrationStore.getState().show(payload)
}
