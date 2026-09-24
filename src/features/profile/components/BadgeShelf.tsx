import { Link } from 'react-router-dom'
import { ErrorState } from '@/components/common/ErrorState'
import { Skeleton } from '@/components/common/Skeleton'
import { achievementTitle } from '@/features/achievements/lib/text'
import type { EvaluatedAchievement } from '@/features/achievements/types'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'

const PLACEHOLDERS = 5

interface BadgeShelfProps {
  achievements: EvaluatedAchievement[]
  /** A badge unlocked since the achievements page was last opened. */
  hasNew: boolean
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}

/**
 * Medallions, earned first; locked ones grey. The newest earned one glints
 * while it hasn't been looked at. Every medallion opens the achievements page,
 * which is the badge detail.
 */
export function BadgeShelf({ achievements, hasNew, isLoading, isError, onRetry }: BadgeShelfProps) {
  const { t } = useT()

  if (isError) return <ErrorState title={t('profile.badgesLoadFailed')} onRetry={onRetry} />

  return (
    <div
      // Phone: one row that scrolls sideways; desktop: wrapped rows in the card.
      className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-0.5 pb-2 pt-1 [scrollbar-width:none] lg:flex-wrap lg:gap-x-2 lg:gap-y-2.5 lg:overflow-visible [&::-webkit-scrollbar]:hidden"
    >
      {isLoading
        ? Array.from({ length: PLACEHOLDERS }, (_, i) => (
            <Skeleton key={i} className="h-16 w-16 flex-none rounded-full" />
          ))
        : achievements.map((item, i) => {
            const title = achievementTitle(t, item.def, item.displayTitle)
            const tier = item.unlocked ? item.def.tiers[item.tierIndex]?.label : null
            const Icon = item.def.icon
            const glint = hasNew && i === 0 && item.unlocked
            return (
              <Link
                key={item.def.id}
                to="/achievements"
                className="grid w-[76px] flex-none snap-start justify-items-center gap-1.5 rounded-inner text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span
                  className={cn(
                    'relative grid h-16 w-16 place-items-center overflow-hidden rounded-full',
                    item.unlocked
                      ? 'text-white shadow-medal'
                      : 'bg-foreground/10 text-muted-strong',
                  )}
                  style={
                    item.unlocked ? { background: `var(--medal-${item.def.tone})` } : undefined
                  }
                >
                  <Icon className="h-7 w-7" strokeWidth={1.9} aria-hidden="true" />
                  {tier && tier !== '★' ? (
                    <em className="num absolute bottom-1 text-caption font-semibold not-italic opacity-90">
                      {tier}
                    </em>
                  ) : null}
                  {glint ? (
                    <span
                      aria-hidden="true"
                      className="absolute -inset-[20%] -translate-x-[120%] bg-gradient-to-r from-transparent from-40% via-white/65 via-50% to-transparent to-60% motion-safe:animate-medal-sheen"
                    />
                  ) : null}
                </span>
                <small className="text-[12px] font-medium leading-[1.2] text-muted">{title}</small>
              </Link>
            )
          })}
    </div>
  )
}
