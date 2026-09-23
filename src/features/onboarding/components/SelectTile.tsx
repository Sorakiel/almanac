import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectTileProps {
  on: boolean
  onClick: () => void
  compact?: boolean
  children: ReactNode
}

/** Shared multi-select tile: icon + label + a check that fills when selected. */
export function SelectTile({ on, onClick, compact, children }: SelectTileProps) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-card border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        compact ? 'px-4 py-3.5' : 'px-4 py-4',
        on
          ? 'border-accent/60 bg-accent/[0.07]'
          : 'border-border bg-surface/60 hover:border-accent/30',
      )}
    >
      {children}
      <span
        aria-hidden="true"
        className={cn(
          'flex h-5 w-5 flex-none items-center justify-center rounded-full border transition-colors',
          on ? 'border-accent bg-accent text-bg' : 'border-muted-strong/50 text-transparent',
        )}
      >
        <Check className="h-3 w-3" />
      </span>
    </button>
  )
}
