import { useEffect } from 'react'
import { DaySeal } from '@/app/shell/DaySeal'
import { useCelebrationStore } from '@/stores/celebration'

/** The seal's own animation runs 2.1 s; take it away just after. */
const SEAL_MS = 2150
/** A caption stays long enough to read. */
const CAPTION_MS = 2000

/**
 * Renders the one active celebration, wherever it was fired from. A perfect
 * day gets the "День закрыт" seal; anything smaller (a streak milestone) is a
 * glass caption at the top. No modal, no confetti, nothing that waits for a
 * tap — badge unlocks are a toast (useCelebrationWatchers).
 */
export function CelebrationHost() {
  const active = useCelebrationStore((s) => s.active)
  const token = useCelebrationStore((s) => s.token)
  const dismiss = useCelebrationStore((s) => s.dismiss)
  const seal = active?.kind === 'perfect-day'

  useEffect(() => {
    if (!active) return
    const id = window.setTimeout(dismiss, seal ? SEAL_MS : CAPTION_MS)
    return () => window.clearTimeout(id)
    // token changes on every show, so a rapid second one restarts the timer.
  }, [active, token, dismiss, seal])

  if (!active) return null

  // Keyed by token so a second celebration replays from the start.
  if (seal) {
    return <DaySeal key={token} label={[active.title, active.message].filter(Boolean).join('. ')} />
  }

  return (
    <div
      key={token}
      className="pointer-events-none fixed inset-x-0 top-0 z-celebration flex justify-center px-4 pt-safe-top"
      role="status"
      aria-live="polite"
    >
      <span className="lg rounded-pill px-4 py-2 text-center text-footnote font-semibold text-accent motion-safe:animate-rise">
        {active.title}
      </span>
    </div>
  )
}
