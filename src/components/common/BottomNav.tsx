import { NavLink, useNavigate } from 'react-router-dom'
import { Dumbbell, LayoutGrid, ListChecks, Plus, Sun } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useUiStore } from '@/stores/ui'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const ITEMS: NavItem[] = [
  { to: '/', label: 'Today', icon: Sun, end: true },
  { to: '/habits', label: 'Habits', icon: ListChecks },
]
const ITEMS_RIGHT: NavItem[] = [
  { to: '/train', label: 'Train', icon: Dumbbell },
  { to: '/more', label: 'More', icon: LayoutGrid },
]

function NavButton({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          'flex w-14 flex-col items-center gap-1 py-1 transition-colors',
          isActive ? 'text-accent' : 'text-muted hover:text-foreground',
        )
      }
    >
      <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
      <span className="font-mono text-[9px] uppercase tracking-label">{item.label}</span>
    </NavLink>
  )
}

/** Glassmorphism bottom nav: two tabs, a raised central +, two more tabs. */
export function BottomNav() {
  const navigate = useNavigate()
  const openNewHabit = useUiStore((s) => s.openNewHabit)

  const handleAdd = () => {
    navigate('/habits')
    openNewHabit()
  }

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[max(env(safe-area-inset-bottom),0.75rem)]"
    >
      <div className="flex items-center gap-1 rounded-pill border bg-surface/75 px-3 py-2 shadow-soft backdrop-blur-nav">
        {ITEMS.map((item) => (
          <NavButton key={item.to} item={item} />
        ))}

        <button
          type="button"
          onClick={handleAdd}
          aria-label="Add habit"
          className="mx-1 -mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-on-accent shadow-soft ring-4 ring-bg transition-colors hover:bg-accent-deep focus-visible:outline-none focus-visible:ring-accent"
        >
          <Plus className="h-6 w-6" aria-hidden="true" />
        </button>

        {ITEMS_RIGHT.map((item) => (
          <NavButton key={item.to} item={item} />
        ))}
      </div>
    </nav>
  )
}
