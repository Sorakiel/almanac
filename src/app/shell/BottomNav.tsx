import { useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChartNoAxesColumn, House, LayoutGrid, type LucideIcon } from 'lucide-react'
import { CreateButton } from '@/app/shell/CreateButton'
import { NAV_MODULES, useModulesStore } from '@/stores/modules'
import { useGlassLens } from '@/hooks/useGlassLens'
import { useT } from '@/hooks/useT'
import { useTabClick } from '@/app/hooks/useTabClick'

interface Tab {
  key: string
  to: string
  label: string
  icon: LucideIcon
}

/** Where the lens sits, in px from the bar's left edge; null hides it. */
interface LensBox {
  left: number
  width: number
}

function startsWith(pathname: string, to: string): boolean {
  return pathname === to || pathname.startsWith(`${to}/`)
}

/**
 * Which tab owns the current route. Module screens opened from the hub belong
 * to «Модули» unless the module has its own pinned tab; screens outside the
 * tabs (settings, friends' profile, admin) light none.
 */
function activeTab(pathname: string, pinnedTo: string | null): string | null {
  if (pathname === '/') return 'today'
  if (startsWith(pathname, '/progress')) return 'progress'
  if (pinnedTo && startsWith(pathname, pinnedTo)) return 'pinned'
  if (startsWith(pathname, '/more') || NAV_MODULES.some((m) => startsWith(pathname, m.to)))
    return 'modules'
  return null
}

/**
 * Phone tab bar: Сегодня · Прогресс · (one pinned module) · Модули on a glass
 * capsule, with the glass "+" standing apart on the right. A lens slides under
 * the current tab.
 */
export function BottomNav() {
  const { t } = useT()
  const { pathname } = useLocation()
  const tabClick = useTabClick()
  const pinnedKey = useModulesStore((s) => s.pinned)
  const enabled = useModulesStore((s) => s.enabled)
  // A pin outlives its module being switched off; the tab only shows while it is on.
  const pinned = NAV_MODULES.find((m) => m.key === pinnedKey && enabled[m.key]) ?? null

  const tabs: Tab[] = [
    { key: 'today', to: '/', label: t('nav.today'), icon: House },
    { key: 'progress', to: '/progress', label: t('nav.progress'), icon: ChartNoAxesColumn },
    ...(pinned
      ? [
          {
            key: 'pinned',
            to: pinned.to,
            label: t(`modules.${pinned.key}.label`),
            icon: pinned.icon,
          },
        ]
      : []),
    { key: 'modules', to: '/more', label: t('nav.modules'), icon: LayoutGrid },
  ]
  const current = activeTab(pathname, pinned?.to ?? null)

  const barRef = useRef<HTMLDivElement>(null)
  useGlassLens(barRef, 'glass-lens-tabbar')
  const [lens, setLens] = useState<LensBox | null>(null)
  useLayoutEffect(() => {
    const bar = barRef.current
    if (!bar) return
    const place = () => {
      const on = bar.querySelector<HTMLElement>('[aria-current="page"]')
      setLens(on ? { left: on.offsetLeft, width: on.offsetWidth } : null)
    }
    place()
    const observer = new ResizeObserver(place)
    observer.observe(bar)
    return () => observer.disconnect()
  }, [current, tabs.length])

  return (
    <div className="tabbar-dock">
      <nav ref={barRef} aria-label={t('nav.primary')} className="tabbar lg">
        {lens ? (
          <span
            aria-hidden="true"
            className="tabbar-lens"
            style={{ left: lens.left, width: lens.width }}
          />
        ) : null}
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <Link
              key={tab.key}
              to={tab.to}
              viewTransition
              onClick={tabClick(tab.to)}
              aria-current={current === tab.key ? 'page' : undefined}
              className="tabbar-tab"
            >
              <Icon aria-hidden="true" />
              <span className="max-w-full truncate px-1">{tab.label}</span>
            </Link>
          )
        })}
      </nav>
      <CreateButton />
    </div>
  )
}
