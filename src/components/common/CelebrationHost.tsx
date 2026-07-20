import { useEffect } from 'react'
import { Confetti } from '@/components/common/Confetti'
import { CelebrationModal } from '@/components/common/CelebrationModal'
import { useCelebrationStore } from '@/stores/celebration'

/** How long a lightweight (non-modal) burst stays before auto-clearing. */
const BURST_MS = 2000

/**
 * Renders the single active celebration, wherever it was fired from. Modal
 * celebrations (achievement unlocks) show the full scene; everything else is a
 * top-of-screen confetti burst with a caption that clears itself.
 */
export function CelebrationHost() {
  const active = useCelebrationStore((s) => s.active)
  const token = useCelebrationStore((s) => s.token)
  const dismiss = useCelebrationStore((s) => s.dismiss)

  const isModal = Boolean(active?.modal)

  // Auto-clear the lightweight bursts; modals wait for the user.
  useEffect(() => {
    if (!active || isModal) return
    const id = window.setTimeout(dismiss, BURST_MS)
    return () => window.clearTimeout(id)
    // token changes on every show, so a rapid second burst restarts the timer.
  }, [active, isModal, token, dismiss])

  if (!active) return null

  if (isModal) {
    return (
      <CelebrationModal
        open
        onOpenChange={(open) => {
          if (!open) dismiss()
        }}
        title={active.title}
        message={active.message ?? ''}
        icon={active.icon}
        actionLabel="Nice"
      />
    )
  }

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
          <span className="rounded-pill border border-accent/30 bg-surface/90 px-4 py-2 text-center font-mono text-[11px] uppercase tracking-label text-accent shadow-soft backdrop-blur-nav motion-safe:animate-rise">
            {active.title}
          </span>
        </div>
      </div>
    </div>
  )
}
