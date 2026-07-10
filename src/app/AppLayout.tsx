import { Outlet, useLocation } from 'react-router-dom'
import { BottomNav } from '@/components/common/BottomNav'
import { HabitFormSheet } from '@/features/habits/components/HabitFormSheet'
import { cn } from '@/lib/utils'

/** Authenticated shell: routed content, bottom nav, and the habit sheet. */
export function AppLayout() {
  const { pathname } = useLocation()
  // Habit detail is a focused sub-page: no bottom nav, its CTA pins to the
  // bottom instead. A flex-column main lets that page stretch and push it down.
  const hideNav = /^\/habits\/[^/]+$/.test(pathname)

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <main className={cn('flex-1 px-5 pt-6', hideNav ? 'flex flex-col pb-6' : 'pb-28')}>
        <Outlet />
      </main>
      {hideNav ? null : <BottomNav />}
      <HabitFormSheet />
    </div>
  )
}
