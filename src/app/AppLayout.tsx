import { useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { BottomNav } from '@/app/shell/BottomNav'
import { CelebrationHost } from '@/app/shell/CelebrationHost'
import { BootSkeleton } from '@/app/shell/BootSkeleton'
import { SyncCapsule } from '@/app/shell/SyncCapsule'
import { ReinstallBanner } from '@/app/shell/ReinstallBanner'
import { Sidebar } from '@/app/shell/Sidebar'
import { RailActive } from '@/app/shell/RailActive'
import { CommandPalette } from '@/app/shell/CommandPalette'
import { DesktopToolbar } from '@/app/shell/DesktopToolbar'
import { ErrorState } from '@/components/common/ErrorState'
import { RailTargetProvider } from '@/components/rail/Rail'
import { HabitFormSheet } from '@/features/habits/components/HabitFormSheet'
import { CreateSheet } from '@/app/shell/CreateSheet'
import { useCelebrationWatchers } from '@/app/hooks/useCelebrationWatchers'
import { useDailyReminder } from '@/app/hooks/useDailyReminder'
import { useGlobalShortcuts } from '@/app/hooks/useGlobalShortcuts'
import { useNativeWidgetSync } from '@/app/hooks/useNativeWidgetSync'
import { useUserSettingsSync } from '@/app/hooks/useUserSettingsSync'
import { useSession } from '@/hooks/useSession'
import { useProfile } from '@/features/settings/hooks/useProfile'
import { useOnboardingStore } from '@/stores/onboarding'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'

/**
 * Authenticated shell. One product, two shapes:
 *  - Mobile (`< lg`): a centered max-w-md column with the glass tab bar and "+".
 *  - Desktop (`lg+`): a floating glass sidebar, a scrolling workspace with the
 *    ⌘K toolbar, and a context rail fed per-page via `<Rail>` (see rail.tsx).
 *
 * The routed page renders once; the chrome around it swaps by breakpoint.
 */
export function AppLayout() {
  const { pathname } = useLocation()
  const [railEl, setRailEl] = useState<HTMLDivElement | null>(null)
  const { profile, isError: profileFailed, isPaused: profilePaused, refetch } = useProfile()
  const { t } = useT()
  const { user } = useSession()
  const dismissedFor = useOnboardingStore((s) => s.dismissedFor)
  // Only trust the device-local fast-path for the account that actually set it.
  const locallyOnboarded = Boolean(user && dismissedFor === user.id)

  // Drive the native/foreground daily habit reminder from the saved preference.
  useDailyReminder()

  // Keep the Android widget / macOS tray glance in sync with today's habits.
  useNativeWidgetSync()

  // Watch live data for moments worth celebrating (perfect day, streak
  // milestones, achievement unlocks). Rendered visuals come from <CelebrationHost>.
  useCelebrationWatchers()
  // Theme, language, modules and sound follow the account across devices.
  useUserSettingsSync()
  // ⌘K palette, ⌘N new habit.
  useGlobalShortcuts()

  // Onboarding is gated on `profiles.onboarded` so it survives across devices.
  // Wait for the profile before deciding, so an already-onboarded user never
  // flashes the welcome screen; the local flag is a fast-path for the device
  // that just finished (covers the gap before the row refetches).
  // Nothing to render without the profile, but say so rather than keep the
  // skeleton up for ever: the API is down, or this device is offline and has
  // never cached the account.
  if (!profile && !locallyOnboarded) {
    if (profileFailed || profilePaused) {
      return (
        <div className="flex min-h-dvh items-center justify-center px-5">
          <ErrorState
            title={profilePaused ? t('common.startOffline') : t('common.startFailed')}
            onRetry={refetch}
          />
        </div>
      )
    }
    return <BootSkeleton />
  }
  if (!profile?.onboarded && !locallyOnboarded) return <Navigate to="/welcome" replace />

  // Focused mobile sub-pages hide the bottom nav (their CTAs own the bottom):
  // habit detail and the workout edit template. Desktop keeps its nav rail.
  const hideNav = /^\/habits\/[^/]+$/.test(pathname) || /^\/train\/[^/]+\/edit$/.test(pathname)

  return (
    <RailTargetProvider target={railEl}>
      <div className="flex min-h-dvh flex-col lg:h-dvh lg:overflow-hidden">
        <ReinstallBanner />

        <div className="flex flex-1 lg:min-h-0">
          {/* The sidebar floats (fixed, 8px inset); this keeps its column clear. */}
          <div className="hidden w-[252px] flex-none lg:block">
            <Sidebar />
          </div>

          <main
            className={cn(
              // Clear the (edge-to-edge) Android status bar on mobile; desktop
              // overrides padding via lg:py-8 where there's no system bar.
              'mx-auto w-full max-w-md flex-1 px-5 pt-[max(env(safe-area-inset-top),1.5rem)]',
              hideNav ? 'flex flex-col pb-6' : 'pb-28',
              'app-scroll lg:mx-0 lg:max-w-none lg:overflow-y-auto lg:px-8 lg:pb-[60px] lg:pt-0',
            )}
          >
            <DesktopToolbar />
            {/* Keyed so the page remounts per route (replays the Cascade). The
                cross-fade itself is the View Transition (see viewTransition on
                the nav links + globals.css), so no per-route animation here.
                hideNav routes stretch to fill main so their own `mt-auto`
                bottom CTA reaches the true bottom instead of trailing content
                with dead space below it — main is only flex-col in that case. */}
            <div key={pathname} className={cn(hideNav && 'flex flex-1 flex-col')}>
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
        <CreateSheet />
        <CommandPalette />
        <SyncCapsule />
        <CelebrationHost />
      </div>
    </RailTargetProvider>
  )
}
