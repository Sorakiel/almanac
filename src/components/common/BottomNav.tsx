import { NavLink, useNavigate } from 'react-router-dom'
import { useUiStore } from '@/stores/ui'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  /** Spec-board glyph — the nav deliberately uses type, not icon fonts. */
  glyph: string
  end?: boolean
}

const ITEMS: NavItem[] = [
  { to: '/', label: 'Today', glyph: '◆', end: true },
  { to: '/habits', label: 'Habits', glyph: '▤' },
]
const ITEMS_RIGHT: NavItem[] = [
  { to: '/train', label: 'Train', glyph: '◇' },
  { to: '/more', label: 'More', glyph: '⊞' },
]

function NavButton({ item }: { item: NavItem }) {
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
      <span aria-hidden="true" className="text-[15px] leading-none">
        {item.glyph}
      </span>
      <span className="font-mono text-[8px] uppercase tracking-label">{item.label}</span>
    </NavLink>
  )
}

/** Glassmorphism bottom nav (spec board): 24px radius bar, glyph tabs, raised square +. */
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
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)]"
    >
      <div className="flex h-[60px] w-full max-w-md items-center rounded-[24px] border bg-surface/75 px-3 shadow-soft backdrop-blur-nav">
        <div className="flex flex-1 justify-around">
          {ITEMS.map((item) => (
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
          {ITEMS_RIGHT.map((item) => (
            <NavButton key={item.to} item={item} />
          ))}
        </div>
      </div>
    </nav>
  )
}
