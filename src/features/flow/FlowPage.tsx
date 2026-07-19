import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { BookOpen, Check, Dumbbell, Timer, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Segmented } from '@/components/ui/segmented'
import { IconTile } from '@/components/common/IconTile'
import { ProgressBlocks } from '@/components/common/ProgressBlocks'
import { SectionLabel } from '@/components/common/SectionLabel'
import { useHabits } from '@/features/habits/hooks/useHabits'
import { setHabitCount } from '@/features/habits/api/habits.api'
import { dailyTarget } from '@/features/habits/lib/frequency'
import { resolveHabitColor, resolveHabitIcon } from '@/features/habits/lib/habitVisuals'
import { useWorkouts } from '@/features/workouts/hooks/useWorkouts'
import { useBooks } from '@/features/reading/hooks/useBooks'
import { FlowWorkoutRunner } from '@/features/flow/components/FlowWorkoutRunner'
import { FlowReadingRunner } from '@/features/flow/components/FlowReadingRunner'
import { useLogFocusSession } from '@/features/flow/hooks/useLogFocusSession'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'
import { useFocusStore } from '@/stores/focus'
import { useModulesStore } from '@/stores/modules'
import { cn } from '@/lib/utils'

const DURATIONS_MIN = [15, 25, 45]
type Mode = 'habit' | 'workout' | 'book' | 'custom'

/**
 * Flow — a standalone deep-work module. Pick a habit to focus on or describe a
 * custom task, choose a length, and run a device-local timer (useFocusStore).
 * Flow is deliberately not a habit: finishing a session only stops the timer.
 */
function FlowPage() {
  const { habits } = useHabits()
  const { workouts } = useWorkouts()
  const { books } = useBooks()
  const workoutsEnabled = useModulesStore((s) => s.enabled.workouts)
  const readingEnabled = useModulesStore((s) => s.enabled.reading)
  const { user } = useSession()
  const { dateKey } = useToday()
  const queryClient = useQueryClient()
  const { endsAt, durationMin, label, habitId, workoutId, bookId, start, stop } = useFocusStore()
  const logFocus = useLogFocusSession()
  const [mode, setMode] = useState<Mode>('habit')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null)
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  const [customLabel, setCustomLabel] = useState('')
  const [duration, setDuration] = useState(25)
  const [now, setNow] = useState(() => Date.now())
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  // If the module behind the selected mode was just disabled, fall back to Habit.
  if ((mode === 'workout' && !workoutsEnabled) || (mode === 'book' && !readingEnabled)) {
    setMode('habit')
  }

  const running = endsAt !== null && durationMin !== null
  const dueHabits = habits.filter((h) => h.dueToday && !h.isComplete)
  const openWorkouts = workouts.filter((w) => w.status !== 'completed')
  const openBooks = books.filter((b) => b.status !== 'finished')
  const selectedHabit = habits.find((h) => h.id === selectedId) ?? null
  const selectedWorkout = workouts.find((w) => w.id === selectedWorkoutId) ?? null
  const selectedBook = books.find((b) => b.id === selectedBookId) ?? null
  const targetLabel =
    mode === 'habit'
      ? (selectedHabit?.name ?? null)
      : mode === 'workout'
        ? (selectedWorkout?.name ?? null)
        : mode === 'book'
          ? (selectedBook?.title ?? null)
          : customLabel.trim() || null

  // Mark the session's habit done (if any), then end. "End" just stops.
  const completeSession = async (minutes: number) => {
    logFocus(minutes, label)
    const habit = habitId ? habits.find((h) => h.id === habitId) : null
    if (habit && user) {
      try {
        await setHabitCount({
          userId: user.id,
          habitId: habit.id,
          date: dateKey,
          count: dailyTarget(habit),
        })
        void queryClient.invalidateQueries({ queryKey: ['habitHistory', habit.id] })
        void queryClient.invalidateQueries({ queryKey: ['habits'] })
        void queryClient.invalidateQueries({ queryKey: ['habitLogs'] })
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not complete habit')
        return
      }
    }
    stop()
    toast.success('Nice — flow complete.')
  }

  // 1 Hz tick while a session runs; also catches sessions that expired offline.
  useEffect(() => {
    if (!running) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [running])

  useEffect(() => {
    if (running && endsAt - now <= 0) {
      // Ran the full block to completion — log the whole planned duration.
      logFocus(durationMin, label)
      stop()
      toast.success('Flow session complete — nice work.')
    }
  }, [running, endsAt, now, durationMin, label, logFocus, stop])

  if (running) {
    const msLeft = Math.max(endsAt - now, 0)
    const minLeft = Math.ceil(msLeft / 60_000)
    const elapsedMin = durationMin - msLeft / 60_000
    const focusedMin = Math.max(0, Math.round(elapsedMin))
    const pct = durationMin ? Math.round((elapsedMin / durationMin) * 100) : 0
    const endSession = () => {
      logFocus(focusedMin, label)
      stop()
    }

    return (
      <div className="flex flex-col gap-5 lg:mx-auto lg:max-w-xl">
        <header>
          <p className="label-mono text-accent">// in session</p>
          <h1 className="mt-1 text-2xl">Flow</h1>
        </header>

        <div className="relative overflow-hidden rounded-card border border-accent/25 bg-surface p-5 lg:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-transparent"
          />
          <div className="relative">
            <p className="label-mono text-[10px] text-accent lg:text-xs">FOCUSING ON</p>
            <p className="mt-2 truncate text-xl font-semibold leading-tight tracking-title lg:mt-3 lg:text-3xl">
              {label ?? 'Focus session'}
            </p>
            <div className="mt-3 flex items-center gap-2.5 lg:mt-6 lg:gap-4">
              <ProgressBlocks
                value={Math.round(elapsedMin * 10)}
                total={durationMin * 10}
                blocks={isDesktop ? 24 : 10}
                size={isDesktop ? 'lg' : 'sm'}
                animated
                aria-label={`${minLeft} minutes left`}
              />
              <span className="font-mono text-xs tabular-nums text-foreground lg:text-2xl">
                {pct}%
              </span>
            </div>
            <div className="mt-3.5 flex items-center justify-between gap-3 lg:mt-7">
              <span className="font-mono text-[11px] tracking-label text-muted lg:text-sm">
                ◷ {minLeft} min left
              </span>
              <div className="flex items-center gap-2 lg:gap-3">
                <button
                  type="button"
                  onClick={endSession}
                  className="inline-flex items-center gap-1.5 rounded-[11px] border bg-surface px-3.5 py-2 font-mono text-[11px] font-bold uppercase tracking-label text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:gap-2 lg:px-5 lg:py-3 lg:text-sm"
                >
                  <X className="h-3.5 w-3.5 lg:h-4 lg:w-4" aria-hidden="true" />
                  End
                </button>
                {workoutId || bookId ? null : (
                  <button
                    type="button"
                    onClick={() => void completeSession(focusedMin)}
                    className="inline-flex items-center gap-1.5 rounded-[11px] bg-accent px-3.5 py-2 font-mono text-[11px] font-bold uppercase tracking-label text-on-accent transition-colors hover:bg-accent-deep hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg lg:gap-2 lg:px-5 lg:py-3 lg:text-sm"
                  >
                    <Check className="h-3.5 w-3.5 lg:h-4 lg:w-4" aria-hidden="true" />
                    {habitId ? 'Complete' : 'Done'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {workoutId ? <FlowWorkoutRunner workoutId={workoutId} onFinish={endSession} /> : null}
        {bookId ? (
          <FlowReadingRunner bookId={bookId} minutes={durationMin} onFinish={endSession} />
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 lg:mx-auto lg:max-w-xl">
      <header>
        <p className="label-mono">// deep work, one block at a time</p>
        <h1 className="mt-1 text-2xl">Flow</h1>
      </header>

      <Segmented
        aria-label="Flow target"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'habit' as const, label: 'Habit' },
          ...(workoutsEnabled ? [{ value: 'workout' as const, label: 'Workout' }] : []),
          ...(readingEnabled ? [{ value: 'book' as const, label: 'Read' }] : []),
          { value: 'custom' as const, label: 'Describe' },
        ]}
      />

      {mode === 'workout' ? (
        <div className="flex flex-col gap-3">
          <SectionLabel>PICK A WORKOUT</SectionLabel>
          {openWorkouts.length === 0 ? (
            <p className="rounded-card border border-dashed p-4 text-sm text-muted">
              No open workouts — create one under Train first.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {openWorkouts.map((workout) => {
                const active = selectedWorkoutId === workout.id
                return (
                  <li key={workout.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedWorkoutId(workout.id)}
                      aria-pressed={active}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-card border p-3 text-left transition-colors',
                        active ? 'border-accent bg-accent/10' : 'hover:border-accent/40',
                      )}
                    >
                      <IconTile icon={Dumbbell} tone="bg-teal/15 text-teal" size="sm" />
                      <span className="font-medium">{workout.name}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      ) : mode === 'habit' ? (
        <div className="flex flex-col gap-3">
          <SectionLabel>DUE TODAY</SectionLabel>
          {dueHabits.length === 0 ? (
            <p className="rounded-card border border-dashed p-4 text-sm text-muted">
              Nothing due right now — switch to “Describe” to focus on anything.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {dueHabits.map((habit) => {
                const color = resolveHabitColor(habit.color)
                const Icon = resolveHabitIcon(habit.icon)
                const active = selectedId === habit.id
                return (
                  <li key={habit.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(habit.id)}
                      aria-pressed={active}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-card border p-3 text-left transition-colors',
                        active ? 'border-accent bg-accent/10' : 'hover:border-accent/40',
                      )}
                    >
                      <IconTile icon={Icon} tone={color.tile} size="sm" />
                      <span className="font-medium">{habit.name}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      ) : mode === 'book' ? (
        <div className="flex flex-col gap-3">
          <SectionLabel>PICK A BOOK</SectionLabel>
          {openBooks.length === 0 ? (
            <p className="rounded-card border border-dashed p-4 text-sm text-muted">
              No books on the go — add one under Reading first.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {openBooks.map((book) => {
                const active = selectedBookId === book.id
                return (
                  <li key={book.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedBookId(book.id)}
                      aria-pressed={active}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-card border p-3 text-left transition-colors',
                        active ? 'border-accent bg-accent/10' : 'hover:border-accent/40',
                      )}
                    >
                      <IconTile icon={BookOpen} tone="bg-amber/15 text-amber" size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{book.title}</span>
                        {book.author ? (
                          <span className="block truncate text-[12px] text-muted">
                            {book.author}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      ) : (
        <label className="flex flex-col gap-1.5">
          <span className="label-mono">What are you focusing on?</span>
          <Input
            placeholder="Write the report intro"
            value={customLabel}
            onChange={(event) => setCustomLabel(event.target.value)}
          />
        </label>
      )}

      <div className="flex flex-col gap-2">
        <SectionLabel>LENGTH</SectionLabel>
        <div className="flex gap-2" role="radiogroup" aria-label="Session length">
          {DURATIONS_MIN.map((min) => (
            <button
              key={min}
              type="button"
              role="radio"
              aria-checked={duration === min}
              onClick={() => setDuration(min)}
              className={cn(
                'flex-1 rounded-tile border py-3 font-mono text-sm tracking-label transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                duration === min
                  ? 'border-accent bg-accent/15 text-accent'
                  : 'text-muted hover:text-foreground',
              )}
            >
              {min}m
            </button>
          ))}
        </div>
      </div>

      <Button
        size="lg"
        className={cn('w-full', targetLabel && 'shadow-glow')}
        disabled={!targetLabel}
        onClick={() =>
          targetLabel &&
          start(duration, targetLabel, {
            habitId: mode === 'habit' ? (selectedHabit?.id ?? null) : null,
            workoutId: mode === 'workout' ? (selectedWorkout?.id ?? null) : null,
            bookId: mode === 'book' ? (selectedBook?.id ?? null) : null,
          })
        }
      >
        <Timer className="h-4 w-4" />
        Start flow
      </Button>
    </div>
  )
}

export default FlowPage
