import { Loader2 } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'

interface LoadingStateProps {
  /** Screen-reader text; defaults to a generic "Loading…". */
  label?: string
  /** Center in the whole viewport — for shells shown before any page chrome. */
  fullScreen?: boolean
  className?: string
}

/** Centered spinner — the loading view of every page and panel. */
export function LoadingState({ label, fullScreen = false, className }: LoadingStateProps) {
  const { t } = useT()
  return (
    <div
      className={cn(
        'flex justify-center',
        fullScreen ? 'min-h-dvh items-center' : 'py-24',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-6 w-6 animate-spin text-accent" aria-hidden="true" />
      <span className="sr-only">{label ?? t('common.loading')}</span>
    </div>
  )
}
