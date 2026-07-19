import { lazy, Suspense, type ComponentType, type ReactElement } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/app/AppLayout'
import { ProtectedRoute } from '@/app/ProtectedRoute'
import { RouteFallback } from '@/components/common/RouteFallback'
import { RouteError } from '@/components/common/RouteError'
import AuthPage from '@/features/auth/AuthPage'

const RELOAD_KEY = 'almanac:chunk-reloaded'

/**
 * Like React.lazy, but self-heals the "failed to import module" error that
 * happens when a redeploy replaces the hashed chunk files a loaded tab still
 * points at: on the first such failure, reload once to pick up the fresh
 * index.html + chunk names. The flag clears on any successful load so a genuine
 * error (offline, real break) still surfaces instead of looping.
 */
function lazyWithReload<T extends ComponentType<unknown>>(factory: () => Promise<{ default: T }>) {
  return lazy(() =>
    factory()
      .then((module) => {
        sessionStorage.removeItem(RELOAD_KEY)
        return module
      })
      .catch((error: unknown) => {
        if (!sessionStorage.getItem(RELOAD_KEY)) {
          sessionStorage.setItem(RELOAD_KEY, '1')
          window.location.reload()
          return new Promise<{ default: T }>(() => {})
        }
        throw error
      }),
  )
}

// Lazy-load routed pages so heavy dependencies (Recharts in Insights/Admin, the
// habit heatmap, the workout session UI) ship as separate chunks and don't bloat
// the initial bundle. AuthPage stays eager — it's the first logged-out paint.
const ResetPasswordPage = lazyWithReload(() => import('@/features/auth/ResetPasswordPage'))
const OnboardingPage = lazyWithReload(() => import('@/features/onboarding/OnboardingPage'))
const DashboardPage = lazyWithReload(() => import('@/features/dashboard/DashboardPage'))
const HabitsPage = lazyWithReload(() => import('@/features/habits/HabitsPage'))
const HabitDetailPage = lazyWithReload(() => import('@/features/habits/HabitDetailPage'))
const FlowPage = lazyWithReload(() => import('@/features/flow/FlowPage'))
const InsightsPage = lazyWithReload(() => import('@/features/insights/InsightsPage'))
const AdminPage = lazyWithReload(() => import('@/features/admin/AdminPage'))
const AdminUserPage = lazyWithReload(() => import('@/features/admin/AdminUserPage'))
const ModulesPage = lazyWithReload(() => import('@/features/modules/ModulesPage'))
const SettingsPage = lazyWithReload(() => import('@/features/settings/SettingsPage'))
const WorkoutsPage = lazyWithReload(() => import('@/features/workouts/WorkoutsPage'))
const WorkoutDetailPage = lazyWithReload(() => import('@/features/workouts/WorkoutDetailPage'))
const ReflectPage = lazyWithReload(() => import('@/features/reflect/ReflectPage'))
const BooksPage = lazyWithReload(() => import('@/features/reading/BooksPage'))
const BookDetailPage = lazyWithReload(() => import('@/features/reading/BookDetailPage'))
const AchievementsPage = lazyWithReload(() => import('@/features/achievements/AchievementsPage'))
const SocialPage = lazyWithReload(() => import('@/features/social/SocialPage'))

/** Wrap a lazy page element in a Suspense boundary with the shared fallback. */
function suspend(element: ReactElement): ReactElement {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>
}

export const router = createBrowserRouter([
  { path: '/auth', element: <AuthPage />, errorElement: <RouteError /> },
  { path: '/auth/reset', element: suspend(<ResetPasswordPage />), errorElement: <RouteError /> },
  {
    element: <ProtectedRoute />,
    errorElement: <RouteError />,
    children: [
      { path: '/welcome', element: suspend(<OnboardingPage />) },
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: suspend(<DashboardPage />) },
          { path: '/habits', element: suspend(<HabitsPage />) },
          { path: '/habits/:id', element: suspend(<HabitDetailPage />) },
          { path: '/flow', element: suspend(<FlowPage />) },
          { path: '/train', element: suspend(<WorkoutsPage />) },
          { path: '/train/:id', element: suspend(<WorkoutDetailPage />) },
          { path: '/insights', element: suspend(<InsightsPage />) },
          { path: '/more', element: suspend(<ModulesPage />) },
          { path: '/admin', element: suspend(<AdminPage />) },
          { path: '/admin/user/:id', element: suspend(<AdminUserPage />) },
          { path: '/reflect', element: suspend(<ReflectPage />) },
          { path: '/reading', element: suspend(<BooksPage />) },
          { path: '/reading/:id', element: suspend(<BookDetailPage />) },
          { path: '/friends', element: suspend(<SocialPage />) },
          { path: '/achievements', element: suspend(<AchievementsPage />) },
          { path: '/settings', element: suspend(<SettingsPage />) },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
