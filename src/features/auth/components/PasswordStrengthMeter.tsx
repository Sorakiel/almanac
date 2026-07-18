import { cn } from '@/lib/utils'
import { MIN_ACCEPTED_LEVEL, scorePassword, type StrengthLevel } from '../passwordStrength'
import { VaultStageTile } from './VaultStageTile'

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
 * signup. Everything — the stage tile, the segmented meter, the crack-time,
 * the entropy count — recomputes on each keystroke from a single score.
 */
export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const { level, bits, title, band, crackTime, fill } = scorePassword(password)
  const met = level >= MIN_ACCEPTED_LEVEL

  return (
    <section
      aria-label="Password strength"
      className="flex flex-col gap-3 rounded-card border bg-surface/60 p-3.5"
    >
      <div className="flex items-center gap-3">
        <VaultStageTile level={level} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-baseline justify-between gap-2">
            <p
              className={cn(
                'truncate font-semibold tracking-title transition-colors duration-500',
                TITLE_CLASS[level],
              )}
            >
              {title}
            </p>
            <span className="label-mono shrink-0 tabular-nums text-muted-strong">
              ≈ {bits} bit{bits === 1 ? '' : 's'}
            </span>
          </div>
          <p className="truncate text-sm text-muted">{crackTime} to crack</p>
        </div>
      </div>

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

      <div className="flex items-center justify-between gap-2">
        <span className="label-mono normal-case text-muted">{band}</span>
        <span
          className={cn(
            'label-mono shrink-0 transition-colors duration-500',
            met ? 'text-teal' : 'text-muted-strong',
          )}
        >
          {met ? 'Vault-grade ✓' : 'Vault-grade required'}
        </span>
      </div>

      {/* Concise, throttled announcement for screen readers. */}
      <p className="sr-only" aria-live="polite">
        Password strength: {title}, {bits} bits of entropy, {crackTime} to crack.
      </p>
    </section>
  )
}
