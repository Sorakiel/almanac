import { cn } from '@/lib/utils'

interface InsightStatProps {
  label: string
  value: string
  unit?: string
  /** Percentage-point / count delta vs the previous period. */
  delta?: number
  /** Suffix on the delta, e.g. "%" or " vs prev". */
  deltaSuffix?: string
  accent?: boolean
  className?: string
}

/** KPI tile: mono label, large value, and an optional up/down delta line. */
export function InsightStat({
  label,
  value,
  unit,
  delta,
  deltaSuffix = '',
  accent = false,
  className,
}: InsightStatProps) {
  const showDelta = delta !== undefined && delta !== 0
  const up = (delta ?? 0) > 0
  return (
    <div className={cn('flex-1 rounded-2xl border bg-panel px-5 py-[18px]', className)}>
      <p className="font-mono text-[9.5px] uppercase tracking-label text-muted-strong">{label}</p>
      <p
        className={cn(
          'mt-1 text-[28px] font-semibold tracking-title tabular-nums',
          accent && 'text-accent',
        )}
      >
        {value}
        {unit ? <span className="text-sm text-muted-strong">{unit}</span> : null}
      </p>
      {showDelta ? (
        <p className={cn('mt-1 font-mono text-[10px]', up ? 'text-teal' : 'text-accent-deep')}>
          {up ? '▲' : '▼'} {Math.abs(delta ?? 0)}
          {deltaSuffix}
        </p>
      ) : null}
    </div>
  )
}
