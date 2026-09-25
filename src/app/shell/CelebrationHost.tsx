import { useEffect } from 'react'
import { DaySeal } from '@/app/shell/DaySeal'
import { useCelebrationStore } from '@/stores/celebration'

/** The seal's own animation runs 2.1 s; take it away just after. */
const SEAL_MS = 2150

/**
 * Renders the one celebration that takes the screen: the "День закрыт" seal
 * for a perfect day. Everything smaller — a streak milestone, a new badge — is
 * a quiet toast from useCelebrationWatchers. No modal, no confetti, nothing
 * that waits for a tap.
 */
export function CelebrationHost() {
  const active = useCelebrationStore((s) => s.active)
  const token = useCelebrationStore((s) => s.token)
  const dismiss = useCelebrationStore((s) => s.dismiss)

  useEffect(() => {
    if (!active) return
    const id = window.setTimeout(dismiss, SEAL_MS)
    return () => window.clearTimeout(id)
    // token changes on every show, so a rapid second one restarts the timer.
  }, [active, token, dismiss])

  if (active?.kind !== 'perfect-day') return null

  // Keyed by token so a second seal replays from the start.
  return <DaySeal key={token} label={[active.title, active.message].filter(Boolean).join('. ')} />
}
