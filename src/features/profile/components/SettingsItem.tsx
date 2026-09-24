import type { ReactNode } from 'react'
import { ChevronRight, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Tile colours for the 30px icon squares — keys of the `--tile-*` tokens. */
export type TileColor =
  'amber' | 'ember' | 'rust' | 'teal' | 'pine' | 'ochre' | 'violet' | 'blue' | 'green' | 'graphite'

interface SettingsItemProps {
  icon?: LucideIcon
  tile?: TileColor
  label: string
  /** A marker after the label — e.g. the new-badge dot. */
  badge?: ReactNode
  /** The current value, shown muted before the chevron. */
  value?: string
  /** A control in place of value + chevron (switch, segmented). */
  control?: ReactNode
  onClick?: () => void
  tone?: 'default' | 'danger'
  center?: boolean
}

const ROW = 'flex min-h-[50px] w-full items-center gap-3 px-4 text-left text-body'

/**
 * One row of a settings group. With `onClick` it's a button with a chevron;
 * with `control` the row holds that control and the label names it.
 */
export function SettingsItem({
  icon: Icon,
  tile = 'graphite',
  label,
  badge,
  value,
  control,
  onClick,
  tone = 'default',
  center = false,
}: SettingsItemProps) {
  const lead = (
    <span className={cn('flex min-w-0 flex-1 items-center gap-3', center && 'justify-center')}>
      {Icon ? (
        <span
          className="grid h-[30px] w-[30px] flex-none place-items-center rounded-[9px] text-white"
          style={{ background: `var(--tile-${tile})` }}
          aria-hidden="true"
        >
          <Icon className="h-[17px] w-[17px]" strokeWidth={2} />
        </span>
      ) : null}
      <span className="truncate">{label}</span>
      {badge}
    </span>
  )

  if (control) {
    return (
      <div className={ROW}>
        {lead}
        {control}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        ROW,
        'transition-colors hover:bg-foreground/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent active:bg-foreground/[0.06]',
        tone === 'danger' && 'text-danger',
      )}
    >
      {lead}
      {value ? <span className="max-w-[45%] truncate text-muted">{value}</span> : null}
      {center ? null : (
        <ChevronRight className="-ml-1.5 h-4 w-4 flex-none text-muted-strong" aria-hidden="true" />
      )}
    </button>
  )
}
