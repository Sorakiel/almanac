import { Outlet } from 'react-router-dom'
import { BottomNav } from '@/components/common/BottomNav'
import { HabitFormSheet } from '@/features/habits/components/HabitFormSheet'

/** Authenticated shell: routed content, bottom nav, and the habit sheet. */
export function AppLayout() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <main className="flex-1 px-5 pb-28 pt-6">
        <Outlet />
      </main>
      <BottomNav />
      <HabitFormSheet />
    </div>
  )
}
