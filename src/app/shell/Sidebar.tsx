import { Link, NavLink } from 'react-router-dom'
import { ChartNoAxesColumn, House, LayoutGrid, Plus, type LucideIcon } from 'lucide-react'
import { NewBadgeDot } from '@/components/common/NewBadgeDot'
import { useHabits } from '@/features/habits/hooks/useHabits'
import { avatarBackground, avatarColorKey, monogram } from '@/features/profile/lib/avatarColors'
import { useProfile } from '@/features/settings/hooks/useProfile'
import { useSession } from '@/hooks/useSession'
import { NAV_MODULES, useModulesStore } from '@/stores/modules'
import { useUiStore } from '@/stores/ui'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'

interface NavEntry {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  /** Live count on the right; hidden at zero. */
  count?: number
}

/** The prototype's .dk-nav row. */
function NavRow({ entry }: { entry: NavEntry }) {
  const Icon = entry.icon
  return (
    <NavLink
      to={entry.to}
      end={entry.end}
      viewTransition
      className={({ isActive }) =>
        cn(
          'group flex h-9 w-full items-center gap-2.5 rounded-inner px-2.5 text-sm font-medium text-foreground transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          isActive ? 'bg-foreground/[0.11]' : 'hover:bg-foreground/[0.06]',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            aria-hidden="true"
            className={cn('h-[18px] w-[18px] flex-none', isActive ? 'text-accent' : 'text-muted')}
            strokeWidth={1.9}
          />
          <span className="min-w-0 flex-1 truncate">{entry.label}</span>
          {entry.count ? (
            <span className="num text-xs font-medium text-muted-strong">{entry.count}</span>
          ) : null}
        </>
      )}
    </NavLink>
  )
}

/**
 * Desktop navigation: a floating glass panel inset from the window edge.
 * «Создать ⌘N», the three hubs, the modules the user has on, and the profile
 * at the bottom.
 */
export function Sidebar() {
  const { t } = useT()
  const { user } = useSession()
  const { profile } = useProfile()
  const { habits } = useHabits()
  const enabled = useModulesStore((s) => s.enabled)
  const openCreate = useUiStore((s) => s.openCreate)

  const dueCount = habits.filter((h) => h.dueToday && !h.isComplete).length
  // The same name and face as the profile screen: the row first, sign-up metadata as a fallback.
  const metaName = user?.user_metadata.display_name as string | undefined
  const name = profile?.display_name || metaName || t('settings.you')

  const primary: NavEntry[] = [
    { to: '/', label: t('nav.today'), icon: House, end: true, count: dueCount },
    { to: '/insights', label: t('nav.progress'), icon: ChartNoAxesColumn },
    { to: '/more', label: t('nav.modules'), icon: LayoutGrid, end: true },
  ]
  // Progress already has its own row above; the rest are the modules that are on.
  const mine: NavEntry[] = NAV_MODULES.filter((m) => m.key !== 'insights' && enabled[m.key]).map(
    (m) => ({ to: m.to, label: t(`modules.${m.key}.label`), icon: m.icon }),
  )

  return (
    <aside className="lg fixed bottom-2 left-2 top-2 z-30 flex w-[236px] flex-col gap-0.5 rounded-[22px] px-3 pb-3 pt-3.5">
      <button
        type="button"
        onClick={() => openCreate()}
        aria-haspopup="dialog"
        aria-keyshortcuts="Meta+N"
        className="mb-3 flex h-[38px] flex-none items-center gap-2 rounded-xl bg-accent-solid px-3 text-sm font-semibold text-on-accent-solid transition-colors hover:bg-accent-solid-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        <Plus className="h-[18px] w-[18px]" strokeWidth={2.4} aria-hidden="true" />
        {t('create.title')}
        <kbd aria-hidden="true" className="kbd ml-auto bg-black/[0.14] text-inherit">
          ⌘N
        </kbd>
      </button>

      <nav aria-label={t('nav.primary')} className="flex flex-col gap-0.5">
        {primary.map((entry) => (
          <NavRow key={entry.to} entry={entry} />
        ))}
      </nav>

      {mine.length > 0 ? (
        <>
          <p className="mx-2.5 mb-1 mt-4 text-xs font-semibold text-muted-strong">
            {t('nav.myModules')}
          </p>
          <nav aria-label={t('nav.myModules')} className="flex flex-col gap-0.5">
            {mine.map((entry) => (
              <NavRow key={entry.to} entry={entry} />
            ))}
          </nav>
        </>
      ) : null}

      <Link
        to="/profile"
        viewTransition
        className="mt-auto flex w-full items-center gap-2.5 rounded-[14px] p-2 text-left transition-colors hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span
          aria-hidden="true"
          style={{ background: avatarBackground(avatarColorKey(profile?.avatar_color)) }}
          className="grid h-9 w-9 flex-none place-items-center rounded-full text-sm font-semibold text-on-accent-deep"
        >
          {monogram(name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <b className="truncate text-sm font-semibold">{name}</b>
            <NewBadgeDot />
          </span>
          <small className="block truncate text-xs text-muted">{t('nav.profileAndSettings')}</small>
        </span>
      </Link>
    </aside>
  )
}
