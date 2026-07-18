import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CompletionToggleProps {
  done: boolean
  onToggle: () => void
  'aria-label': string
  /** Brand accent (habits) or teal (workouts / sets). */
  tone?: 'accent' | 'teal'
  /** `sm` = 32px (list rows), `md` = 36px (cards). */
  size?: 'sm' | 'md'
  disabled?: boolean
}

// Squared-off "checkbox" — the terminal look, shared by every completion
// control so habits, sets and workouts stay identical. Tone only swaps the
// done-state colour; shape, radius and the pop/ripple animation are constant.
const TONE = {
  accent: { on: 'border-accent/50 bg-accent/10 text-accent', ripple: 'border-accent' },
  teal: { on: 'border-teal/50 bg-teal/15 text-teal', ripple: 'border-teal' },
} as const

const SIZE = { sm: 'h-8 w-8', md: 'h-9 w-9' } as const

/** The one completion checkbox used across habits, sets and workouts. */
export function CompletionToggle({
  done,
  onToggle,
  tone = 'accent',
  size = 'sm',
  disabled,
  'aria-label': ariaLabel,
}: CompletionToggleProps) {
  const t = TONE[tone]
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={done}
      aria-label={ariaLabel}
      disabled={disabled}
      className={cn(
        'relative flex shrink-0 items-center justify-center rounded-[9px] border transition-colors active:scale-90',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        SIZE[size],
        done ? t.on : 'text-transparent hover:border-accent hover:text-accent',
      )}
    >
      {done ? (
        <span
          key="ripple"
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-0 rounded-[9px] border motion-safe:animate-ripple motion-reduce:hidden',
            t.ripple,
          )}
        />
      ) : null}
      <Check
        key={done ? 'on' : 'off'}
        className={cn('h-4 w-4', done && 'motion-safe:animate-pop')}
        aria-hidden="true"
      />
    </button>
  )
}
