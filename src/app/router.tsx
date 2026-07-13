import { lazy, Suspense, type ReactElement } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/app/AppLayout'
import { ProtectedRoute } from '@/app/ProtectedRoute'
import { RouteFallback } from '@/components/common/RouteFallback'
import AuthPage from '@/features/auth/AuthPage'

// Lazy-load routed pages so heavy dependencies (Recharts in Insights/Admin, the
// habit heatmap, the workout session UI) ship as separate chunks and don't bloat
// the initial bundle. AuthPage stays eager — it's the first logged-out paint.
const ResetPasswordPage = lazy(() => import('@/features/auth/ResetPasswordPage'))
const OnboardingPage = lazy(() => import('@/features/onboarding/OnboardingPage'))
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'))
const HabitsPage = lazy(() => import('@/features/habits/HabitsPage'))
const HabitDetailPage = lazy(() => import('@/features/habits/HabitDetailPage'))
const FlowPage = lazy(() => import('@/features/flow/FlowPage'))
const InsightsPage = lazy(() => import('@/features/insights/InsightsPage'))
const AdminPage = lazy(() => import('@/features/admin/AdminPage'))
const AdminUserPage = lazy(() => import('@/features/admin/AdminUserPage'))
const ModulesPage = lazy(() => import('@/features/modules/ModulesPage'))
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'))
const WorkoutsPage = lazy(() => import('@/features/workouts/WorkoutsPage'))
const WorkoutDetailPage = lazy(() => import('@/features/workouts/WorkoutDetailPage'))
const ReflectPage = lazy(() => import('@/features/reflect/ReflectPage'))

/** Wrap a lazy page element in a Suspense boundary with the shared fallback. */
function suspend(element: ReactElement): ReactElement {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>
}

export const router = createBrowserRouter([
  { path: '/auth', element: <AuthPage /> },
  { path: '/auth/reset', element: suspend(<ResetPasswordPage />) },
  {
    element: <ProtectedRoute />,
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
          { path: '/settings', element: suspend(<SettingsPage />) },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
