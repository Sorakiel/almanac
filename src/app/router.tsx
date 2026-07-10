import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/app/AppLayout'
import { ProtectedRoute } from '@/app/ProtectedRoute'
import AuthPage from '@/features/auth/AuthPage'
import ResetPasswordPage from '@/features/auth/ResetPasswordPage'
import DashboardPage from '@/features/dashboard/DashboardPage'
import HabitsPage from '@/features/habits/HabitsPage'
import HabitDetailPage from '@/features/habits/HabitDetailPage'
import ModulesPage from '@/features/modules/ModulesPage'
import SettingsPage from '@/features/settings/SettingsPage'
import WorkoutsPage from '@/features/workouts/WorkoutsPage'
import ReflectPage from '@/features/reflect/ReflectPage'

export const router = createBrowserRouter([
  { path: '/auth', element: <AuthPage /> },
  { path: '/auth/reset', element: <ResetPasswordPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/habits', element: <HabitsPage /> },
          { path: '/habits/:id', element: <HabitDetailPage /> },
          { path: '/train', element: <WorkoutsPage /> },
          { path: '/more', element: <ModulesPage /> },
          { path: '/reflect', element: <ReflectPage /> },
          { path: '/settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
