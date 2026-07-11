import { useLocation } from 'react-router-dom'
import { useTheme } from '@/hooks/useTheme'

/** Best-effort window title from the current route, mirroring the spec board. */
function useWindowTitle(): string {
  const { pathname } = useLocation()
  if (pathname === '/') return 'Today'
  if (pathname.startsWith('/habits')) return 'Habits'
  if (pathname.startsWith('/train')) return 'Train'
  if (pathname.startsWith('/insights')) return 'Insights'
  if (pathname.startsWith('/reflect')) return 'Reflect'
  if (pathname.startsWith('/flow')) return 'Flow'
  if (pathname.startsWith('/more')) return 'Modules'
  if (pathname.startsWith('/settings')) return 'Settings'
  if (pathname.startsWith('/admin')) return 'Admin'
  return 'Almanac'
}

/** Desktop window chrome: traffic-light motif, window title, theme toggle. */
export function TopBar() {
  const title = useWindowTitle()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="flex h-[52px] flex-none items-center justify-between border-b bg-chrome px-[22px]">
      <div className="flex items-center">
        <span className="font-mono text-[11px] text-muted-strong">Almanac — {title}</span>
      </div>

      <button
        type="button"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'dark' ? 'coffee' : 'dark'} theme`}
        className="flex items-center gap-2 rounded-pill px-2 py-1 font-mono text-[11px] text-muted-strong transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span aria-hidden="true" className="text-accent">
          ◇
        </span>
        {theme === 'dark' ? 'dark' : 'coffee'} · toggle theme
      </button>
    </div>
  )
}
