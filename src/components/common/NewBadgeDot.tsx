import { useT } from '@/hooks/useT'
import { useBadgesStore } from '@/stores/badges'
import { cn } from '@/lib/utils'

interface NewBadgeDotProps {
  /**
   * Pin the dot to the top-right corner of the element it precedes (an
   * avatar), without that element's container needing to be positioned.
   */
  corner?: boolean
}

/** An accent dot on a profile entry point while a new badge waits to be seen. */
export function NewBadgeDot({ corner = false }: NewBadgeDotProps) {
  const { t } = useT()
  const unseen = useBadgesStore((s) => s.unseen)
  if (!unseen) return null
  const dot = (
    <span
      role="img"
      aria-label={t('badges.unseen')}
      className={cn(
        'block h-2.5 w-2.5 shrink-0 rounded-full bg-accent',
        corner && 'absolute -right-0.5 -top-0.5 ring-2 ring-bg',
      )}
    />
  )
  return corner ? <span className="pointer-events-none relative block h-0">{dot}</span> : dot
}
