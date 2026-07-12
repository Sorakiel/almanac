import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/app/AppLayout'
import { ProtectedRoute } from '@/app/ProtectedRoute'
import AuthPage from '@/features/auth/AuthPage'
import ResetPasswordPage from '@/features/auth/ResetPasswordPage'
import OnboardingPage from '@/features/onboarding/OnboardingPage'
import DashboardPage from '@/features/dashboard/DashboardPage'
import HabitsPage from '@/features/habits/HabitsPage'
import HabitDetailPage from '@/features/habits/HabitDetailPage'
import FlowPage from '@/features/flow/FlowPage'
import InsightsPage from '@/features/insights/InsightsPage'
import AdminPage from '@/features/admin/AdminPage'
import AdminUserPage from '@/features/admin/AdminUserPage'
import ModulesPage from '@/features/modules/ModulesPage'
import SettingsPage from '@/features/settings/SettingsPage'
import WorkoutsPage from '@/features/workouts/WorkoutsPage'
import WorkoutDetailPage from '@/features/workouts/WorkoutDetailPage'
import ReflectPage from '@/features/reflect/ReflectPage'

export const router = createBrowserRouter([
  { path: '/auth', element: <AuthPage /> },
  { path: '/auth/reset', element: <ResetPasswordPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/welcome', element: <OnboardingPage /> },
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/habits', element: <HabitsPage /> },
          { path: '/habits/:id', element: <HabitDetailPage /> },
          { path: '/flow', element: <FlowPage /> },
          { path: '/train', element: <WorkoutsPage /> },
          { path: '/train/:id', element: <WorkoutDetailPage /> },
          { path: '/insights', element: <InsightsPage /> },
          { path: '/more', element: <ModulesPage /> },
          { path: '/admin', element: <AdminPage /> },
          { path: '/admin/user/:id', element: <AdminUserPage /> },
          { path: '/reflect', element: <ReflectPage /> },
          { path: '/settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
