import { cn } from '@/lib/utils'

interface BarRowProps {
  label: string
  /** Fill, 0–1. */
  value: number
  display: string
  /** Any CSS colour — a habit's own, or a module token. */
  color: string
  /** A wider name column — only the two-column habits card has the room. */
  wide?: boolean
}

/** Name · bar · value — one row of the prototype's `.p-hb` list. */
export function BarRow({ label, value, display, color, wide = false }: BarRowProps) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100)
  return (
    <div
      className={cn(
        'grid grid-cols-bar-row items-center gap-2 text-footnote',
        wide && 'lg:grid-cols-bar-row-wide',
      )}
    >
      <span className="truncate">{label}</span>
      <span className="block h-2 overflow-hidden rounded-full bg-foreground/10" aria-hidden="true">
        <span
          className="block h-full rounded-full"
          style={{ width: `${pct}%`, background: color }}
        />
      </span>
      <span className="num text-right text-muted">{display}</span>
    </div>
  )
}
