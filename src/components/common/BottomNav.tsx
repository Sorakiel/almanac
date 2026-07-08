import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ListChecks, Plus } from 'lucide-react'
import { useUiStore } from '@/stores/ui'
import { cn } from '@/lib/utils'

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex flex-col items-center gap-1 px-4 py-2 text-xs transition-colors',
    isActive ? 'text-accent' : 'text-muted hover:text-foreground',
  )

/** Glassmorphism bottom nav with a central "+" action (add habit). */
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
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mb-4 flex items-center gap-2 rounded-pill border border-border bg-surface/70 px-3 py-2 shadow-soft backdrop-blur-nav">
        <NavLink to="/" className={navItemClass} end>
          <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
          <span>Home</span>
        </NavLink>

        <button
          type="button"
          onClick={handleAdd}
          aria-label="Add habit"
          className="mx-1 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-on-accent shadow-card transition-colors hover:bg-accent-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          <Plus className="h-6 w-6" aria-hidden="true" />
        </button>

        <NavLink to="/habits" className={navItemClass}>
          <ListChecks className="h-5 w-5" aria-hidden="true" />
          <span>Habits</span>
        </NavLink>
      </div>
    </nav>
  )
}
