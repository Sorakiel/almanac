import { Skeleton } from '@/components/common/Skeleton'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'

interface LoadingStateProps {
  /** Screen-reader text; defaults to a generic "Loading…". */
  label?: string
  /** Fill the viewport — for focused screens shown without the app chrome. */
  fullScreen?: boolean
  className?: string
}

const ROWS = 4

/**
 * The loading view of every page and panel: the outline of what is coming — a
 * summary card and a few rows — rather than a spinner. Most screens are exactly
 * that shape, and an outline tells the eye where to look before data lands;
 * three centred spinners in a row read as the app being broken.
 */
export function LoadingState({ label, fullScreen = false, className }: LoadingStateProps) {
  const { t } = useT()
  return (
    <div
      className={cn(
        'flex flex-col gap-3',
        fullScreen ? 'mx-auto min-h-dvh w-full max-w-md px-5 pt-6' : 'py-2',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Skeleton className="h-24 w-full rounded-card" />
      {Array.from({ length: ROWS }, (_, i) => (
        <Skeleton key={i} className="h-11 w-full" />
      ))}
      <span className="sr-only">{label ?? t('common.loading')}</span>
    </div>
  )
}
