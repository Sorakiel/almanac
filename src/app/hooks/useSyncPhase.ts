import { useEffect, useState } from 'react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { usePendingWriteCount } from '@/hooks/usePendingWrites'

export type SyncPhase = 'hidden' | 'offline' | 'sending' | 'saved' | 'backOnline'

/** How long the closing line stays up before the capsule goes. */
const CLOSING_MS = { saved: 1400, backOnline: 1200 } as const

type Spell = 'none' | 'offline' | 'draining'
type Closing = keyof typeof CLOSING_MS | null

/**
 * What the sync capsule should say. It exists only around an offline spell:
 * while offline, then while the queue drains, then one short all-clear. An
 * ordinary online write is pending for a moment too, but saying "sending" on
 * every tap would be noise, so outside an offline spell it stays hidden.
 */
export function useSyncPhase(): { phase: SyncPhase; pending: number } {
  const online = useOnlineStatus()
  const pending = usePendingWriteCount()
  const [spell, setSpell] = useState<Spell>(online ? 'none' : 'offline')
  const [closing, setClosing] = useState<Closing>(null)

  // Derived during render (React's "adjust state when inputs change"), not in
  // an effect, so the capsule never paints one frame behind the network.
  if (!online && spell !== 'offline') {
    setSpell('offline')
    setClosing(null)
  } else if (online && spell === 'offline') {
    setSpell(pending > 0 ? 'draining' : 'none')
    if (pending === 0) setClosing('backOnline')
  } else if (online && spell === 'draining' && pending === 0) {
    setSpell('none')
    setClosing('saved')
  }

  useEffect(() => {
    if (!closing) return
    const id = setTimeout(() => setClosing(null), CLOSING_MS[closing])
    return () => clearTimeout(id)
  }, [closing])

  const phase: SyncPhase =
    spell === 'offline' ? 'offline' : spell === 'draining' ? 'sending' : (closing ?? 'hidden')
  return { phase, pending }
}
