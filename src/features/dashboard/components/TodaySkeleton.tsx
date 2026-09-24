import { Skeleton } from '@/components/common/Skeleton'
import { useT } from '@/hooks/useT'

const ROWS = 5

/** Today's outline while the habits load — the shape of the page, not a spinner. */
export function TodaySkeleton() {
  const { t } = useT()
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-3 pt-2">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mb-2 h-9 w-48" />
      <Skeleton className="h-28 rounded-card lg:hidden" />
      {Array.from({ length: ROWS }, (_, i) => (
        <Skeleton key={i} className="h-14 rounded-card lg:max-w-3xl" />
      ))}
      <span className="sr-only">{t('dashboard.loading')}</span>
    </div>
  )
}
