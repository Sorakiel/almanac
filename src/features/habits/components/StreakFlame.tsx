import { Flame } from 'lucide-react'
import { flameTier } from '@/features/habits/lib/milestones'
import { cn } from '@/lib/utils'

interface StreakFlameProps {
  streak: number
  /** Due today, unfinished, on a live streak — one miss ends it. */
  atRisk?: boolean
  className?: string
}

/**
 * The streak flame — flickers to life past the first milestone (7d) and gains a
 * glowing halo at the higher tiers (30d, 100d). An at-risk streak overrides the
 * tier with an urgent accent pulse until the day is closed.
 */
export function StreakFlame({ streak, atRisk = false, className }: StreakFlameProps) {
  const tier = flameTier(streak)
  const alight = tier.level >= 1

  return (
    <span
      className={cn(
        'relative inline-flex items-center justify-center',
        atRisk ? 'text-accent' : tier.colorClass,
        className,
      )}
    >
      <Flame
        className={cn(
          'h-3 w-3',
          atRisk ? 'animate-pulse' : alight ? 'motion-safe:animate-flame-flicker' : undefined,
          tier.glow && 'drop-shadow-[0_0_5px_rgb(var(--color-accent)/0.7)]',
        )}
        strokeWidth={tier.level >= 3 ? 2.25 : 2}
        aria-hidden="true"
      />
    </span>
  )
}
