import { useEffect } from 'react'
import { useSyncPhase, type SyncPhase } from '@/app/hooks/useSyncPhase'
import { useT } from '@/hooks/useT'
import { useUiStore } from '@/stores/ui'
import { cn } from '@/lib/utils'

const DOT: Record<Exclude<SyncPhase, 'hidden'>, string> = {
  offline: 'bg-amber',
  sending: 'bg-accent motion-safe:animate-pulse',
  saved: 'bg-teal',
  backOnline: 'bg-teal',
}

/**
 * The network's state, told truthfully and out of the way: a floating glass
 * capsule above the tab bar that never shifts the page. Offline, writes are
 * queued and survive a reload — so it says they will be saved, and how many
 * are waiting; back online it counts them out and clears itself.
 */
export function SyncCapsule() {
  const { t } = useT()
  const { phase, pending } = useSyncPhase()
  const setVisible = useUiStore((s) => s.setSyncCapsuleVisible)
  const visible = phase !== 'hidden'

  useEffect(() => setVisible(visible), [visible, setVisible])

  const text =
    phase === 'offline'
      ? pending > 0
        ? t('sync.offlinePending', { count: pending })
        : t('sync.offline')
      : phase === 'sending'
        ? t('sync.sending', { count: pending })
        : phase === 'saved'
          ? t('sync.saved')
          : t('sync.backOnline')

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[104px] z-50 flex justify-center px-4 lg:bottom-6"
    >
      {visible ? (
        <div className="lg flex min-h-11 max-w-full items-center gap-2.5 rounded-full px-4 text-[14.5px] font-medium text-foreground motion-safe:animate-capsule-in">
          <span aria-hidden="true" className={cn('h-2 w-2 shrink-0 rounded-full', DOT[phase])} />
          <span className="truncate">{text}</span>
        </div>
      ) : null}
    </div>
  )
}
