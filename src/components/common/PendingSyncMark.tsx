import { Clock } from 'lucide-react'
import { usePendingHabitIds } from '@/hooks/usePendingWrites'
import { useT } from '@/hooks/useT'

interface PendingSyncMarkProps {
  habitId: string
}

/** A small clock on a habit whose latest change is still waiting for the network. */
export function PendingSyncMark({ habitId }: PendingSyncMarkProps) {
  const { t } = useT()
  const pending = usePendingHabitIds().has(habitId)
  if (!pending) return null
  return (
    <span className="inline-flex shrink-0 text-amber" title={t('sync.pendingMark')}>
      <Clock className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">{t('sync.pendingMark')}</span>
    </span>
  )
}
