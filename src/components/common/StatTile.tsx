import { useCountUp } from '@/hooks/useCountUp'
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
    <div className={cn('flex flex-col gap-2 rounded-tile border bg-surface px-3 py-3', className)}>
      <span className="label-mono">{label}</span>
      <span
        className={cn(
          'text-2xl font-semibold tabular-nums tracking-title',
          accent ? 'text-accent' : 'text-foreground',
        )}
      >
        <TileValue value={value} />
      </span>
    </div>
  )
}

/** Count plain-integer values up on change; render anything else verbatim. */
function TileValue({ value }: { value: string }) {
  const isInt = /^\d+$/.test(value)
  const display = useCountUp(isInt ? Number(value) : 0)
  return <>{isInt ? display : value}</>
}
