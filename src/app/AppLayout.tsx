import { Outlet } from 'react-router-dom'
import { toast } from 'sonner'
import { LogOut, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BottomNav } from '@/components/common/BottomNav'
import { HabitFormSheet } from '@/features/habits/components/HabitFormSheet'
import { useAuthActions } from '@/features/auth/hooks/useAuthActions'
import { useTheme } from '@/hooks/useTheme'

/** Authenticated shell: header, routed content, bottom nav, and the habit sheet. */
export function AppLayout() {
  const { theme, toggleTheme } = useTheme()
  const { logOut } = useAuthActions()

  const handleSignOut = async () => {
    try {
      await logOut.mutateAsync()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not sign out')
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="flex items-center justify-between px-5 pb-2 pt-6">
        <p className="label-mono">// almanac</p>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            disabled={logOut.isPending}
            aria-label="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 px-5 pb-28">
        <Outlet />
      </main>

      <BottomNav />
      <HabitFormSheet />
    </div>
  )
}
