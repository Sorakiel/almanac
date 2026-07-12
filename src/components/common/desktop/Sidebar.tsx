import { Link, NavLink } from 'react-router-dom'
import { Home, type LucideIcon } from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'
import { useHabits } from '@/features/habits/hooks/useHabits'
import { useProfile } from '@/features/settings/hooks/useProfile'
import { useSession } from '@/hooks/useSession'
import { NAV_MODULES, useModulesStore } from '@/stores/modules'
import { cn } from '@/lib/utils'

interface NavEntry {
  to: string
  label: string
  /** Lucide icon — shared with the modules hub so nav and "More" stay in sync. */
  icon: LucideIcon
  end?: boolean
  /** Optional live count badge (resolved by the sidebar). */
  count?: number
}

/** Diamond brand mark — accent gradient tile with a rotated cut-out. */
function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative block rounded-[9px] bg-gradient-to-br from-accent to-accent-deep',
        className,
      )}
    >
      <span className="absolute left-1/2 top-1/2 h-[10px] w-[10px] -translate-x-1/2 -translate-y-1/2 rotate-45 border-[1.6px] border-bg" />
    </span>
  )
}

function NavRow({ entry }: { entry: NavEntry }) {
  const Icon = entry.icon
  return (
    <NavLink
      to={entry.to}
      end={entry.end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-[13px] px-3.5 py-3 text-[14.5px] transition-colors',
          isActive
            ? 'bg-accent font-semibold text-on-accent'
            : 'text-muted hover:bg-surface/60 hover:text-foreground',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            aria-hidden="true"
            className={cn('h-[18px] w-[18px]', !isActive && 'text-muted-strong')}
            strokeWidth={1.75}
          />
          <span className="flex-1">{entry.label}</span>
          {entry.count !== undefined && entry.count > 0 ? (
            <span
              className={cn(
                'font-mono text-[11px]',
                isActive ? 'font-bold' : 'text-muted-strong/70',
              )}
            >
              {entry.count}
            </span>
          ) : null}
        </>
      )}
    </NavLink>
  )
}

/** Desktop nav rail (spec board): brand, primary nav, modules, profile card. */
export function Sidebar() {
  const { user } = useSession()
  const { profile } = useProfile()
  const { habits } = useHabits()
  const enabled = useModulesStore((s) => s.enabled)

  const dueCount = habits.filter((h) => (h.dueToday || h.isComplete) && !h.isComplete).length
  const name = (user?.user_metadata.display_name as string | undefined) ?? 'You'
  const roleLabel = profile?.role === 'admin' ? 'Admin' : 'Member'

  // Today always leads; the enabled modules follow (mirroring the bottom nav,
  // so the "More" switches add/remove them here).
  const primary: NavEntry[] = [
    { to: '/', label: 'Today', icon: Home, end: true, count: dueCount },
    ...NAV_MODULES.filter((m) => enabled[m.key]).map((m) => ({
      to: m.to,
      label: m.label,
      icon: m.icon,
      count: m.key === 'habits' ? habits.length : undefined,
    })),
  ]

  return (
    <aside className="flex w-[250px] flex-none flex-col border-r bg-chrome px-[18px] py-6">
      <Link to="/" className="mb-[22px] flex items-center gap-[11px] px-2 focus-visible:outline-none">
        <BrandMark className="h-[30px] w-[30px]" />
        <span className="font-mono text-[17px] font-bold tracking-[0.06em]">ALMANAC</span>
      </Link>

      <nav aria-label="Primary" className="flex flex-col gap-0.5">
        {primary.map((entry) => (
          <NavRow key={entry.to} entry={entry} />
        ))}
      </nav>

      <p className="px-3.5 pb-2.5 pt-[22px] font-mono text-[9.5px] uppercase tracking-label text-muted-strong/80">
        modules
      </p>
      <NavLink
        to="/more"
        className={({ isActive }) =>
          cn(
            'flex items-center gap-[11px] rounded-[11px] px-3.5 py-[9px] text-[13.5px] transition-colors',
            isActive ? 'text-foreground' : 'text-muted hover:text-foreground',
          )
        }
      >
        <span aria-hidden="true" className="h-[9px] w-[9px] rounded-[3px] bg-muted-strong/50" />
        <span className="flex-1">More</span>
        <span className="font-mono text-[9px] text-muted-strong/70">hub</span>
      </NavLink>

      <div className="flex-1" />

      <Link
        to="/settings"
        className="flex items-center gap-[11px] rounded-tile border bg-surface p-[11px] transition-colors hover:border-accent/40"
      >
        <Avatar name={name} size="sm" className="h-9 w-9 rounded-[11px]" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-semibold">{name}</span>
          <span className="block font-mono text-[9.5px] text-muted-strong">{roleLabel}</span>
        </span>
        <span aria-hidden="true" className="text-sm text-muted-strong">
          ⚙
        </span>
      </Link>
    </aside>
  )
}
