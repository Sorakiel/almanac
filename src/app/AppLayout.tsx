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
import { useRouteMotion } from '@/app/hooks/useRouteMotion'
import { useCompactTitle } from '@/app/hooks/useCompactTitle'
import { CompactTitleBar } from '@/app/shell/CompactTitleBar'
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
  // Tab switch / push / pop for the route View Transition; entrance once per screen.
  useRouteMotion(pathname)
  // The large title collapses into the top bar on scroll.
  // Watches <main>, which exists only once the shell has more than the skeleton to show.
  const compactTitle = useCompactTitle(Boolean(profile || locallyOnboarded))

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
  // the workout edit template. Desktop keeps its nav rail.
  const hideNav = /^\/train\/[^/]+\/edit$/.test(pathname)

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
            <DesktopToolbar title={compactTitle.title} compact={compactTitle.compact} />
            {/* Not keyed by route: the move between screens is the View
                Transition (useRouteMotion + globals.css), and a screen's
                entrance cascade plays on its first visit only. hideNav routes
                stretch to fill main so their own `mt-auto` bottom CTA reaches
                the true bottom — main is only flex-col in that case.
                Every screen reads as one bounded column on desktop (1024px, the
                prototype's 1280 workspace): dense dashboards stay readable on a
                big monitor instead of running edge to edge. */}
            <div
              data-page-column
              className={cn('lg:mx-auto lg:w-full lg:max-w-5xl', hideNav && 'flex flex-1 flex-col')}
            >
              <Outlet />
            </div>
          </main>

          {/* Today carries its own aside (desktop-prototype.html); the shell's rail would be a
              third column. Elsewhere the rail shows only when something is in it (.context-rail). */}
          {pathname === '/' ? null : (
            <aside className="context-rail app-scroll w-[340px] flex-none flex-col overflow-y-auto border-l bg-chrome px-6 py-6">
              <RailActive />
              <div ref={setRailEl} className="flex flex-1 flex-col" />
            </aside>
          )}
        </div>

        {hideNav ? null : (
          <div className="lg:hidden">
            <BottomNav />
          </div>
        )}
        <CompactTitleBar title={compactTitle.title} visible={compactTitle.compact} />
        <HabitFormSheet />
        <CreateSheet />
        <CommandPalette />
        <SyncCapsule />
        <CelebrationHost />
      </div>
    </RailTargetProvider>
  )
}
