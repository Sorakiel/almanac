import { useLocation } from 'react-router-dom'
import { Caret } from '@/components/common/Caret'
import { useTheme } from '@/hooks/useTheme'

/** Current route as a shell path segment, e.g. "today", "flow". */
function useRouteSegment(): string {
  const { pathname } = useLocation()
  if (pathname === '/') return 'today'
  if (pathname.startsWith('/habits')) return 'habits'
  if (pathname.startsWith('/train')) return 'train'
  if (pathname.startsWith('/insights')) return 'insights'
  if (pathname.startsWith('/reflect')) return 'reflect'
  if (pathname.startsWith('/flow')) return 'flow'
  if (pathname.startsWith('/more')) return 'modules'
  if (pathname.startsWith('/settings')) return 'settings'
  if (pathname.startsWith('/admin')) return 'admin'
  return '~'
}

/** Desktop window chrome: shell-prompt path, theme toggle. */
export function TopBar() {
  const segment = useRouteSegment()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="flex h-[52px] flex-none items-center justify-between border-b bg-chrome px-[22px]">
      <div className="flex items-center gap-1 font-mono text-[11px] text-muted-strong">
        <span className="text-accent">◇</span>
        <span>almanac</span>
        <span className="text-muted-strong/50">:</span>
        <span className="text-muted">~/{segment}</span>
        <span className="text-accent">$</span>
        <Caret className="h-[1em]" />
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
