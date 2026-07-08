import { Flame, Sun, Moon, Dumbbell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { StatCard } from '@/components/common/StatCard'
import { ProgressBlocks } from '@/components/common/ProgressBlocks'
import { EmptyState } from '@/components/common/EmptyState'
import { useTheme } from '@/hooks/useTheme'

// Temporary design-system showcase — replaced by the router in the Phase-1 slice.
function App() {
  const { theme, toggleTheme } = useTheme()

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-5 py-10">
      <header className="flex items-center justify-between">
        <div>
          <p className="label-mono">// almanac</p>
          <h1 className="text-2xl">Design system</h1>
        </div>
        <Button variant="surface" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Streak" value={12} hint="days" icon={Flame} />
        <StatCard label="Workouts" value={3} hint="this week" icon={Dumbbell} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s habits</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <ProgressBlocks value={5} total={8} aria-label="5 of 8 habits complete" />
          <div className="flex gap-2">
            <Button size="sm">Primary</Button>
            <Button size="sm" variant="outline">
              Outline
            </Button>
            <Button size="sm" variant="ghost">
              Ghost
            </Button>
          </div>
        </CardContent>
      </Card>

      <EmptyState
        icon={Flame}
        title="No habits yet"
        description="Create your first habit to start a streak."
        action={<Button size="sm">Add habit</Button>}
      />
    </main>
  )
}

export default App
