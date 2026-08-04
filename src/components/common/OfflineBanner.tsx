import { CloudOff } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

/**
 * Say so when the network is gone.
 *
 * The app keeps working from its cache, which is exactly why this is needed:
 * reads are real, writes are not. A tap still animates — the optimistic update
 * is local — but nothing is sent, and React Query holds the write without ever
 * replaying it (see `../../lib/queryClient.ts`). Warning about that is the
 * difference between a user re-logging a habit and a user losing a streak they
 * believe they kept.
 */
export function OfflineBanner() {
  const online = useOnlineStatus()
  if (online) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 border-b border-amber/30 bg-amber/10 px-4 py-2.5 pt-[max(env(safe-area-inset-top),0.625rem)]"
    >
      <CloudOff className="h-4 w-4 shrink-0 text-amber" aria-hidden="true" />
      <p className="min-w-0 flex-1 text-[13px] leading-snug">
        <span className="font-semibold">Offline.</span>{' '}
        <span className="text-muted">
          Your saved data is here to read. Anything you change now won’t be saved — log it again
          once you’re back.
        </span>
      </p>
    </div>
  )
}
