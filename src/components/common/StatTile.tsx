import { cn } from '@/lib/utils'

interface StatTileProps {
  label: string
  value: string
  /** Emphasize the value in the brand accent (e.g. current streak). */
  accent?: boolean
  className?: string
}

/** Compact metric tile: mono label above a large value. Used on habit detail. */
export function StatTile({ label, value, accent = false, className }: StatTileProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-tile border bg-surface px-3 py-3',
        className,
      )}
    >
      <span className="label-mono">{label}</span>
      <span
        className={cn(
          'text-2xl font-semibold tracking-title tabular-nums',
          accent ? 'text-accent' : 'text-foreground',
        )}
      >
        {value}
      </span>
    </div>
  )
}
