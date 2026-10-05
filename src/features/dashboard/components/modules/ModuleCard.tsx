import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

export type ModuleHue = 'accent' | 'teal' | 'amber'

const HUE: Record<ModuleHue, string> = {
  accent: 'rgb(var(--color-accent))',
  teal: 'rgb(var(--color-teal))',
  amber: 'rgb(var(--color-amber))',
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
  /** The module's own screen — the kicker and value open it (§2.8), marked «›». */
  to?: string
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
  to,
}: ModuleCardProps) {
  const text = (
    <>
      <p className="today-mod-k">
        {kicker}
        {to ? <span aria-hidden="true"> ›</span> : null}
      </p>
      <p className={valueClassName ?? 'today-mod-v'}>{value}</p>
    </>
  )
  return (
    <article className="today-mod" style={{ '--hue': HUE[hue] } as CSSProperties}>
      <div className="today-mod-top">
        <span className="today-ic" aria-hidden="true">
          <Icon strokeWidth={1.9} />
        </span>
        {to ? (
          <Link to={to} viewTransition className="today-mod-link min-w-0 flex-1">
            {text}
          </Link>
        ) : (
          <div className="min-w-0 flex-1">{text}</div>
        )}
        {action}
      </div>
      {children}
    </article>
  )
}
