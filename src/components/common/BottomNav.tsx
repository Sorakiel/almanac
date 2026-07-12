import { NavLink, useNavigate } from 'react-router-dom'
import { Home, LayoutGrid, type LucideIcon } from 'lucide-react'
import { MAX_NAV_MODULES, NAV_MODULES, useModulesStore } from '@/stores/modules'
import { useUiStore } from '@/stores/ui'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  /** Lucide icon — matches the modules hub so the nav and "More" stay in sync. */
  icon: LucideIcon
  end?: boolean
}

const TODAY: NavItem = { to: '/', label: 'Today', icon: Home, end: true }
const MORE: NavItem = { to: '/more', label: 'More', icon: LayoutGrid }

function NavButton({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          'flex w-12 flex-col items-center gap-1 py-1 transition-colors',
          isActive ? 'text-accent' : 'text-muted hover:text-foreground',
        )
      }
    >
      <Icon aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.75} />
      <span className="font-mono text-[8px] uppercase tracking-label">{item.label}</span>
    </NavLink>
  )
}

/** Glassmorphism bottom nav (spec board): Today + enabled modules + More. */
export function BottomNav() {
  const navigate = useNavigate()
  const openNewHabit = useUiStore((s) => s.openNewHabit)
  const enabled = useModulesStore((s) => s.enabled)

  // Today and More always anchor the nav; enabled modules fill the middle.
  const modules = NAV_MODULES.filter((m) => enabled[m.key]).slice(0, MAX_NAV_MODULES)
  const items: NavItem[] = [TODAY, ...modules, MORE]
  const mid = Math.ceil(items.length / 2)
  const left = items.slice(0, mid)
  const right = items.slice(mid)

  const handleAdd = () => {
    navigate('/habits')
    openNewHabit()
  }

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)]"
    >
      <div className="flex h-[60px] w-full max-w-md items-center rounded-[24px] border bg-surface/75 px-3 shadow-soft backdrop-blur-nav">
        <div className="flex flex-1 justify-around">
          {left.map((item) => (
            <NavButton key={item.to} item={item} />
          ))}
        </div>

        <button
          type="button"
          onClick={handleAdd}
          aria-label="Add habit"
          className="-mt-6 flex h-[52px] w-[52px] flex-none items-center justify-center rounded-[17px] border-[3px] border-bg bg-accent text-2xl leading-none text-on-accent shadow-glow transition-colors hover:bg-accent-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span aria-hidden="true">+</span>
        </button>

        <div className="flex flex-1 justify-around">
          {right.map((item) => (
            <NavButton key={item.to} item={item} />
          ))}
        </div>
      </div>
    </nav>
  )
}
