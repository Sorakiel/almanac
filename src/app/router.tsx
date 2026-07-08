import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/app/AppLayout'
import { ProtectedRoute } from '@/app/ProtectedRoute'
import AuthPage from '@/features/auth/AuthPage'
import DashboardPage from '@/features/dashboard/DashboardPage'
import HabitsPage from '@/features/habits/HabitsPage'

export const router = createBrowserRouter([
  { path: '/auth', element: <AuthPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/habits', element: <HabitsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
