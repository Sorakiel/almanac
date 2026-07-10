import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Check, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Segmented } from '@/components/ui/segmented'
import { IconTile } from '@/components/common/IconTile'
import { ProgressBlocks } from '@/components/common/ProgressBlocks'
import { SectionLabel } from '@/components/common/SectionLabel'
import { useHabits } from '@/features/habits/hooks/useHabits'
import { resolveHabitColor, resolveHabitIcon } from '@/features/habits/lib/habitVisuals'
import { useFocusStore } from '@/stores/focus'
import { cn } from '@/lib/utils'

const DURATIONS_MIN = [15, 25, 45]
type Mode = 'habit' | 'custom'

/**
 * Flow — a standalone deep-work module. Pick a habit to focus on or describe a
 * custom task, choose a length, and run a device-local timer (useFocusStore).
 * Flow is deliberately not a habit: finishing a session only stops the timer.
 */
function FlowPage() {
  const { habits } = useHabits()
  const { endsAt, durationMin, label, start, stop } = useFocusStore()
  const [mode, setMode] = useState<Mode>('habit')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [customLabel, setCustomLabel] = useState('')
  const [duration, setDuration] = useState(25)
  const [now, setNow] = useState(() => Date.now())

  const running = endsAt !== null && durationMin !== null
  const dueHabits = habits.filter((h) => h.dueToday && !h.isComplete)
  const selectedHabit = habits.find((h) => h.id === selectedId) ?? null
  const targetLabel = mode === 'habit' ? (selectedHabit?.name ?? null) : customLabel.trim() || null

  // 1 Hz tick while a session runs; also catches sessions that expired offline.
  useEffect(() => {
    if (!running) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [running])

  useEffect(() => {
    if (running && endsAt - now <= 0) {
      stop()
      toast.success('Flow session complete — nice work.')
    }
  }, [running, endsAt, now, stop])

  if (running) {
    const msLeft = Math.max(endsAt - now, 0)
    const minLeft = Math.ceil(msLeft / 60_000)
    const elapsedMin = durationMin - msLeft / 60_000
    const pct = durationMin ? Math.round((elapsedMin / durationMin) * 100) : 0

    return (
      <div className="flex flex-col gap-5">
        <header>
          <p className="label-mono text-accent">// in session</p>
          <h1 className="mt-1 text-2xl">Flow</h1>
        </header>

        <div className="relative overflow-hidden rounded-card border border-accent/25 bg-surface p-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-transparent"
          />
          <div className="relative flex flex-col gap-5">
            <div>
              <p className="label-mono text-accent">FOCUSING ON</p>
              <p className="mt-2 text-xl font-semibold tracking-title">{label ?? 'Focus session'}</p>
            </div>
            <div className="flex items-center gap-3">
              <ProgressBlocks
                value={Math.round(elapsedMin * 10)}
                total={durationMin * 10}
                blocks={22}
                aria-label={`${minLeft} minutes left`}
              />
              <span className="ml-auto font-mono text-sm tabular-nums text-accent">{pct}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="label-mono">◷ {minLeft} min left</span>
              <Button size="sm" onClick={stop}>
                <Check className="h-4 w-4" />
                Done
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="label-mono">// deep work, one block at a time</p>
        <h1 className="mt-1 text-2xl">Flow</h1>
      </header>

      <Segmented
        aria-label="Flow target"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'habit', label: 'Pick a habit' },
          { value: 'custom', label: 'Describe' },
        ]}
      />

      {mode === 'habit' ? (
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
        onClick={() => targetLabel && start(duration, targetLabel)}
      >
        <Timer className="h-4 w-4" />
        Start flow
      </Button>
    </div>
  )
}

export default FlowPage
