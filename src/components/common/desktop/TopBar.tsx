import { useLocation } from 'react-router-dom'
import { Caret } from '@/components/common/Caret'
import { useTheme } from '@/hooks/useTheme'

/**
 * Current route as a shell-style path, nested to mirror the real IA so the
 * prompt reads like a console tree, not a flat label. Depth is only added where
 * the hierarchy is genuine (a detail view under its list, admin reached through
 * settings) — inventing nesting for flat top-level routes would just lie.
 */
function useRoutePath(): string {
  const { pathname } = useLocation()
  if (pathname === '/') return 'today'
  if (pathname.startsWith('/habits/')) return 'habits/detail'
  if (pathname.startsWith('/habits')) return 'habits'
  if (pathname.startsWith('/train/')) return 'train/detail'
  if (pathname.startsWith('/train')) return 'train'
  if (pathname.startsWith('/reading/')) return 'reading/detail'
  if (pathname.startsWith('/reading')) return 'reading'
  if (pathname.startsWith('/insights')) return 'insights'
  if (pathname.startsWith('/reflect')) return 'reflect'
  if (pathname.startsWith('/flow')) return 'flow'
  if (pathname.startsWith('/friends')) return 'friends'
  if (pathname.startsWith('/achievements')) return 'achievements'
  if (pathname.startsWith('/more')) return 'modules'
  // Admin lives behind Settings (SettingsPage → "Admin console").
  if (pathname.startsWith('/admin/user')) return 'settings/admin/user'
  if (pathname.startsWith('/admin')) return 'settings/admin'
  if (pathname.startsWith('/settings')) return 'settings'
  return '~'
}

/** Desktop window chrome: shell-prompt path, theme toggle. */
export function TopBar() {
  const routePath = useRoutePath()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="flex h-[52px] flex-none items-center justify-between border-b bg-chrome px-[22px]">
      <div className="flex items-center gap-1 font-mono text-[11px] text-muted-strong">
        <span className="text-accent">◇</span>
        <span>almanac</span>
        <span className="text-muted-strong/50">:</span>
        <span className="text-muted">~/{routePath}</span>
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
