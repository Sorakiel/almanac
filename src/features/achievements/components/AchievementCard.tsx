import { Lock } from 'lucide-react'
import { ProgressBlocks } from '@/components/common/ProgressBlocks'
import { cn } from '@/lib/utils'
import type { AchievementTone, EvaluatedAchievement } from '@/features/achievements/types'

const TONES: Record<
  AchievementTone,
  { tile: string; wash: string; border: string; chip: string; pip: string; text: string }
> = {
  accent: {
    tile: 'from-accent to-accent-deep',
    wash: 'from-accent/[0.10]',
    border: 'border-accent/30',
    chip: 'bg-accent text-on-accent',
    pip: 'bg-accent',
    text: 'text-accent',
  },
  teal: {
    tile: 'from-teal to-teal/70',
    wash: 'from-teal/[0.10]',
    border: 'border-teal/30',
    chip: 'bg-teal text-bg',
    pip: 'bg-teal',
    text: 'text-teal',
  },
  amber: {
    tile: 'from-amber to-amber/70',
    wash: 'from-amber/[0.10]',
    border: 'border-amber/30',
    chip: 'bg-amber text-bg',
    pip: 'bg-amber',
    text: 'text-amber',
  },
}

/** A single achievement: glyph, tier, level pips, and progress to the next tier. */
export function AchievementCard({ item }: { item: EvaluatedAchievement }) {
  const { def, unlocked, tierIndex, displayTitle, nextGoal, value } = item
  const Icon = def.icon
  const tone = TONES[def.tone]
  const currentTier = tierIndex >= 0 ? def.tiers[tierIndex] : null

  return (
    <div
      className={cn(
        'relative flex flex-col gap-3 rounded-[22px] border p-4 transition-[transform,box-shadow,border-color] hover:-translate-y-0.5',
        unlocked
          ? cn(
              'bg-gradient-to-br via-surface to-surface shadow-soft hover:shadow-card',
              tone.wash,
              tone.border,
            )
          : 'border-dashed bg-surface',
      )}
    >
      <div className="flex items-start gap-3.5">
        <div className="relative">
          <span
            className={cn(
              'relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl',
              unlocked
                ? cn('bg-gradient-to-br text-bg shadow-glow', tone.tile)
                : 'bg-bg/40 text-muted-strong/40',
            )}
          >
            <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
            {unlocked ? (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 -left-full w-1/2 bg-white/40 blur-[2px] motion-safe:animate-shine"
              />
            ) : null}
          </span>
          <span
            className={cn(
              'absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 font-mono text-[10px] font-bold',
              unlocked ? tone.chip : 'bg-surface text-muted-strong',
            )}
          >
            {unlocked && currentTier ? currentTier.label : <Lock className="h-2.5 w-2.5" />}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className={cn('font-semibold', !unlocked && 'text-muted')}>{displayTitle}</p>
          <p className="mt-0.5 text-[13px] leading-snug text-muted">{def.description}</p>
        </div>
      </div>

      {def.tiers.length > 1 ? (
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {def.tiers.map((tier, index) => (
            <span
              key={tier.goal}
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                index <= tierIndex ? tone.pip : 'bg-muted-strong/25',
              )}
            />
          ))}
        </div>
      ) : null}

      {nextGoal !== null ? (
        <div className="flex items-center gap-3">
          <ProgressBlocks
            value={value}
            total={nextGoal}
            blocks={16}
            aria-label="Progress to next tier"
          />
          <span className="ml-auto whitespace-nowrap font-mono text-[10px] text-muted-strong">
            {value} / {nextGoal}
            {def.unit ? ` ${def.unit}` : ''}
          </span>
        </div>
      ) : unlocked ? (
        <span className={cn('font-mono text-[10px] uppercase tracking-label', tone.text)}>
          ◇ max tier reached
        </span>
      ) : null}
    </div>
  )
}
