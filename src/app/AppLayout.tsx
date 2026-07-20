import { useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { BottomNav } from '@/components/common/BottomNav'
import { ReinstallBanner } from '@/components/common/ReinstallBanner'
import { Sidebar } from '@/components/common/desktop/Sidebar'
import { TopBar } from '@/components/common/desktop/TopBar'
import { RailActive } from '@/components/common/desktop/RailActive'
import { RailTargetProvider } from '@/components/common/desktop/rail'
import { HabitFormSheet } from '@/features/habits/components/HabitFormSheet'
import { useDailyReminder } from '@/hooks/useDailyReminder'
import { useProfile } from '@/features/settings/hooks/useProfile'
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
  const { profile } = useProfile()
  const locallyOnboarded = useOnboardingStore((s) => s.dismissed)

  // Drive the native/foreground daily habit reminder from the saved preference.
  useDailyReminder()

  // Onboarding is gated on `profiles.onboarded` so it survives across devices.
  // Wait for the profile before deciding, so an already-onboarded user never
  // flashes the welcome screen; the local flag is a fast-path for the device
  // that just finished (covers the gap before the row refetches).
  if (!profile && !locallyOnboarded) {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-accent" aria-hidden="true" />
        <span className="sr-only">Loading…</span>
      </div>
    )
  }
  if (!profile?.onboarded && !locallyOnboarded) return <Navigate to="/welcome" replace />

  // Habit detail is a focused mobile sub-page: no bottom nav, CTA pins bottom.
  // On desktop the persistent nav rail always stays.
  const hideNav = /^\/habits\/[^/]+$/.test(pathname)

  return (
    <RailTargetProvider target={railEl}>
      <div className="flex min-h-dvh flex-col lg:h-dvh lg:overflow-hidden">
        <ReinstallBanner />
        <div className="hidden lg:block">
          <TopBar />
        </div>

        <div className="flex flex-1 lg:min-h-0">
          <div className="hidden lg:flex">
            <Sidebar />
          </div>

          <main
            className={cn(
              // Clear the (edge-to-edge) Android status bar on mobile; desktop
              // overrides padding via lg:py-8 where there's no system bar.
              'mx-auto w-full max-w-md flex-1 px-5 pt-[max(env(safe-area-inset-top),1.5rem)]',
              hideNav ? 'flex flex-col pb-6' : 'pb-28',
              'app-scroll lg:mx-0 lg:max-w-none lg:overflow-y-auto lg:px-10 lg:py-8',
            )}
          >
            <div
              key={pathname}
              className="motion-safe:duration-300 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2"
            >
              <Outlet />
            </div>
          </main>

          <aside className="app-scroll hidden w-[340px] flex-none flex-col overflow-y-auto border-l bg-chrome px-6 py-6 lg:flex">
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
