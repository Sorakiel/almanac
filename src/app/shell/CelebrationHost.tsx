import { useEffect } from 'react'
import { Confetti } from '@/components/common/Confetti'
import { useCelebrationStore } from '@/stores/celebration'

/** How long a burst stays before auto-clearing. */
const BURST_MS = 2000

/**
 * Renders the single active celebration, wherever it was fired from: a
 * top-of-screen confetti burst with a caption that clears itself. Nothing here
 * waits for the user — badge unlocks are a toast (useCelebrationWatchers).
 */
export function CelebrationHost() {
  const active = useCelebrationStore((s) => s.active)
  const token = useCelebrationStore((s) => s.token)
  const dismiss = useCelebrationStore((s) => s.dismiss)

  useEffect(() => {
    if (!active) return
    const id = window.setTimeout(dismiss, BURST_MS)
    return () => window.clearTimeout(id)
    // token changes on every show, so a rapid second burst restarts the timer.
  }, [active, token, dismiss])

  if (!active) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center"
      role="status"
      aria-live="polite"
    >
      {/* keyed by token so the confetti + caption remount (replay) each burst */}
      <div key={token} className="relative w-full max-w-md">
        <Confetti count={20} />
        <div className="mt-[max(env(safe-area-inset-top),1rem)] flex justify-center px-4">
          <span className="lg rounded-pill px-4 py-2 text-center text-footnote font-semibold text-accent motion-safe:animate-rise">
            {active.title}
          </span>
        </div>
      </div>
    </div>
  )
}
