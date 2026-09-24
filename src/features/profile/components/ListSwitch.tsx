import { cn } from '@/lib/utils'

interface ListSwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  'aria-label': string
}

/**
 * The prototype's list switch: 48×28, green when on, springy thumb. Scoped to
 * the profile lists for now — the shared `Switch` moves to this look with the
 * rest of Phase 3's materials, not screen by screen.
 */
export function ListSwitch({ checked, onCheckedChange, 'aria-label': ariaLabel }: ListSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative h-7 w-12 flex-none rounded-full transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
        checked ? 'bg-success' : 'bg-sheet-fill dark:bg-foreground/[0.16]',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow-thumb',
          'transition-transform duration-300 ease-spring motion-reduce:transition-none',
          checked && 'translate-x-5',
        )}
      />
    </button>
  )
}
