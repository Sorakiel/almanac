import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ChoiceChipProps {
  active: boolean
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}

/** A small pressable option in a row of choices; the chosen one fills solid. */
export function ChoiceChip({ active, onClick, disabled, children }: ChoiceChipProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'rounded-tile border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        active
          ? 'border-transparent bg-accent-solid text-on-accent-solid'
          : 'border-border text-muted hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}
