import { useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { BottomNav } from '@/components/common/BottomNav'
import { Sidebar } from '@/components/common/desktop/Sidebar'
import { TopBar } from '@/components/common/desktop/TopBar'
import { RailActive } from '@/components/common/desktop/RailActive'
import { RailTargetProvider } from '@/components/common/desktop/rail'
import { HabitFormSheet } from '@/features/habits/components/HabitFormSheet'
import { useOnboardingStore } from '@/stores/onboarding'
import { cn } from '@/lib/utils'

/**
 * Authenticated shell. One product, two shapes:
 *  - Mobile (`< lg`): a centered max-w-md column with the glass bottom nav.
 *  - Desktop (`lg+`): the spec-board three-column shell — nav rail, a scrolling
 *    workspace, and a context rail fed per-page via `<Rail>` (see rail.tsx).
 *
 * The routed page renders once; the chrome around it swaps by breakpoint.
 */
export function AppLayout() {
  const { pathname } = useLocation()
  const [railEl, setRailEl] = useState<HTMLDivElement | null>(null)
  const onboarded = useOnboardingStore((s) => s.dismissed)

  // First run: send new users to the welcome splash before the app shell.
  if (!onboarded) return <Navigate to="/welcome" replace />

  // Habit detail is a focused mobile sub-page: no bottom nav, CTA pins bottom.
  // On desktop the persistent nav rail always stays.
  const hideNav = /^\/habits\/[^/]+$/.test(pathname)

  return (
    <RailTargetProvider target={railEl}>
      <div className="flex min-h-dvh flex-col lg:h-dvh lg:overflow-hidden">
        <div className="hidden lg:block">
          <TopBar />
        </div>

        <div className="flex flex-1 lg:min-h-0">
          <div className="hidden lg:flex">
            <Sidebar />
          </div>

          <main
            className={cn(
              'mx-auto w-full max-w-md flex-1 px-5 pt-6',
              hideNav ? 'flex flex-col pb-6' : 'pb-28',
              'lg:mx-0 lg:max-w-none lg:overflow-y-auto lg:px-10 lg:py-8',
            )}
          >
            <Outlet />
          </main>

          <aside className="hidden w-[340px] flex-none flex-col overflow-y-auto border-l bg-chrome px-6 py-6 lg:flex">
            <RailActive />
            <div ref={setRailEl} className="flex flex-1 flex-col" />
          </aside>
        </div>

        {hideNav ? null : (
          <div className="lg:hidden">
            <BottomNav />
          </div>
        )}
        <HabitFormSheet />
      </div>
    </RailTargetProvider>
  )
}
