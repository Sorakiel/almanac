import { cn } from '@/lib/utils'
import { scorePassword, type StrengthLevel } from '../passwordStrength'
import { VaultStageTile } from './VaultStageTile'
import { useT } from '@/hooks/useT'

interface PasswordStrengthMeterProps {
  password: string
}

// Literal per-tier classes (kept whole so Tailwind never purges them).
const TITLE_CLASS: Record<StrengthLevel, string> = {
  0: 'text-danger',
  1: 'text-accent',
  2: 'text-amber',
  3: 'text-teal',
}
const FILL_CLASS: Record<StrengthLevel, string> = {
  0: 'bg-danger',
  1: 'bg-accent',
  2: 'bg-amber',
  3: 'bg-teal',
}

const SEGMENTS = [0, 1, 2, 3]

/**
 * Live "vault door" strength read-out shown under the password field on
 * signup. A single score drives everything — the stage tile, the segmented
 * meter, the crack-time and the entropy — and recomputes on each keystroke.
 */
export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const { t, locale } = useT()
  const { level, bits, tier, crackTime, fill } = scorePassword(password)
  const tierLabel = t(`auth.strength.${tier}`)
  const entropy = t('auth.crack.entropy', { count: bits })
  // The wordings carry no count; the units do, and Russian needs a form per unit.
  const time =
    crackTime.unit === 'never' || crackTime.unit === 'instant' || crackTime.unit === 'forever'
      ? t(`auth.crack.${crackTime.unit}`)
      : // Grouped digits after pluralising: "1 234 567 years" reads, "1234567 years"
        // does not — but Intl.PluralRules must see the raw number to pick a form.
        t(`auth.crack.${crackTime.unit}`, { count: crackTime.value }).replace(
          String(crackTime.value),
          crackTime.value.toLocaleString(locale),
        )

  return (
    <section
      aria-label={t('auth.strengthLabel')}
      className="flex items-center gap-3 overflow-hidden rounded-card border bg-surface/60 p-3"
    >
      <VaultStageTile level={level} />

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {/* Segmented meter — each cell fills in turn, flowing into the next. */}
        <div className="flex gap-1.5" aria-hidden="true">
          {SEGMENTS.map((i) => {
            const segFill = Math.min(Math.max((fill - i / SEGMENTS.length) * SEGMENTS.length, 0), 1)
            return (
              <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-pill bg-border/10">
                <div
                  className={cn(
                    'h-full rounded-pill transition-[width,background-color] duration-500 ease-out',
                    FILL_CLASS[level],
                  )}
                  style={{ width: `${segFill * 100}%` }}
                />
              </div>
            )
          })}
        </div>

        <div className="min-w-0">
          <p
            className={cn(
              'truncate font-semibold tracking-title transition-colors duration-500',
              TITLE_CLASS[level],
            )}
          >
            {tierLabel}
          </p>
          <p className="truncate text-sm text-muted">{t('auth.crack.toCrack', { time })}</p>
          <p className="label-mono mt-0.5 truncate text-muted-strong">{entropy}</p>
        </div>
      </div>

      {/* Concise, throttled announcement for screen readers. */}
      <p className="sr-only" aria-live="polite">
        {t('auth.crack.announce', { tier: tierLabel, entropy, time })}
      </p>
    </section>
  )
}
