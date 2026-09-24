import type { CSSProperties, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export type ModuleHue = 'accent' | 'teal' | 'amber'

const HUE: Record<ModuleHue, string> = {
  accent: 'rgb(var(--color-accent))',
  teal: 'rgb(var(--color-teal))',
  amber: 'rgb(var(--color-warning))',
}

interface ModuleCardProps {
  icon: LucideIcon
  hue: ModuleHue
  /** Small line above the value ("Reading"). */
  kicker: string
  value: ReactNode
  /** The one action, right-aligned on the top line. */
  action?: ReactNode
  children?: ReactNode
  valueClassName?: string
}

/** A finished state in the action slot ("Done", "Goal ✓"), tinted in the module's hue. */
export function ModuleDonePill({ children }: { children: ReactNode }) {
  return (
    <span className="today-pill is-ghost" style={{ '--pill': 'var(--hue)' } as CSSProperties}>
      {children}
    </span>
  )
}

/** A module on Today: tinted icon, a kicker and a value, one action, optional body. */
export function ModuleCard({
  icon: Icon,
  hue,
  kicker,
  value,
  action,
  children,
  valueClassName,
}: ModuleCardProps) {
  return (
    <article className="today-mod" style={{ '--hue': HUE[hue] } as CSSProperties}>
      <div className="today-mod-top">
        <span className="today-ic" aria-hidden="true">
          <Icon strokeWidth={1.9} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="today-mod-k">{kicker}</p>
          <p className={valueClassName ?? 'today-mod-v'}>{value}</p>
        </div>
        {action}
      </div>
      {children}
    </article>
  )
}
