import { useEffect, useRef } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ChevronDown, Minus, Plus } from 'lucide-react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet } from '@/components/ui/sheet'
import { useHabits } from '@/features/habits/hooks/useHabits'
import { useHabitMutations } from '@/features/habits/hooks/useHabitMutations'
import {
  HABIT_COLORS,
  HABIT_COLOR_OPTIONS,
  HABIT_ICONS,
  HABIT_ICON_OPTIONS,
  type HabitColor,
  type HabitIcon,
} from '@/features/habits/lib/habitVisuals'
import type { HabitFrequency, HabitTimeOfDay } from '@/features/habits/types'
import { useUiStore } from '@/stores/ui'
import { cn } from '@/lib/utils'

const schema = z.object({
  name: z.string().trim().min(1, 'Give it a name').max(60),
  description: z.string().trim().max(160).optional(),
  icon: z.enum(HABIT_ICON_OPTIONS as [HabitIcon, ...HabitIcon[]]),
  color: z.enum(HABIT_COLOR_OPTIONS as [HabitColor, ...HabitColor[]]),
  frequency: z.enum(['daily', 'weekly', 'weekdays', 'x_per_week', 'every_n_days', 'every_n_weeks']),
  target_count: z.number().int().min(1).max(50),
  time_of_day: z.enum(['anytime', 'morning', 'afternoon', 'evening']),
})

type FormValues = z.infer<typeof schema>

const DEFAULTS: FormValues = {
  name: '',
  description: '',
  icon: 'sparkles',
  color: 'accent',
  frequency: 'daily',
  target_count: 1,
  time_of_day: 'anytime',
}

// The "Repeats" control presents four presets; Custom expands into an
// "Every N [unit]" row, where the unit chooses the underlying cadence.
type Preset = 'daily' | 'weekdays' | 'weekly' | 'custom'
type CustomUnit = 'days' | 'weeks' | 'per_week'

const PRESETS: { value: Preset; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'custom', label: 'Custom' },
]

const UNIT_FREQ: Record<CustomUnit, HabitFrequency> = {
  days: 'every_n_days',
  weeks: 'every_n_weeks',
  per_week: 'x_per_week',
}
const FREQ_UNIT: Partial<Record<HabitFrequency, CustomUnit>> = {
  every_n_days: 'days',
  every_n_weeks: 'weeks',
  x_per_week: 'per_week',
}
const UNIT_RANGE: Record<CustomUnit, { min: number; max: number }> = {
  days: { min: 2, max: 30 },
  weeks: { min: 2, max: 8 },
  per_week: { min: 2, max: 7 },
}
const UNIT_OPTIONS: { value: CustomUnit; label: string }[] = [
  { value: 'days', label: 'days' },
  { value: 'weeks', label: 'weeks' },
  { value: 'per_week', label: '× / week' },
]
const TIME_OPTIONS: { value: HabitTimeOfDay; label: string }[] = [
  { value: 'anytime', label: 'anytime' },
  { value: 'morning', label: 'morning' },
  { value: 'afternoon', label: 'afternoon' },
  { value: 'evening', label: 'evening' },
]

function presetOf(frequency: HabitFrequency): Preset {
  if (frequency === 'daily' || frequency === 'weekdays' || frequency === 'weekly') return frequency
  return 'custom'
}
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Create/edit bottom sheet with icon, color, repeats, and time-of-day pickers. */
export function HabitFormSheet() {
  const habitForm = useUiStore((s) => s.habitForm)
  const closeHabitForm = useUiStore((s) => s.closeHabitForm)
  const { habits } = useHabits()
  const { create, update, archive } = useHabitMutations()

  const editing = habitForm && habitForm !== 'new' ? habits.find((h) => h.id === habitForm) : null
  const open = habitForm !== null

  const { register, handleSubmit, reset, control, setValue, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  })
  const values = useWatch({ control }) as FormValues
  const pending = create.isPending || update.isPending

  const preset = presetOf(values.frequency)
  const unit: CustomUnit = FREQ_UNIT[values.frequency] ?? 'days'

  // Reset exactly once per open (or when the edited habit's data first
  // arrives). `editing` gets a fresh identity every render — depending on it
  // directly makes this effect re-fire on ANY re-render and wipe in-progress
  // input (the "clicking Weekly does nothing" bug).
  const lastResetKey = useRef<string | null>(null)
  useEffect(() => {
    if (!open) {
      lastResetKey.current = null
      return
    }
    const key = editing ? editing.id : 'new'
    if (lastResetKey.current === key) return
    lastResetKey.current = key
    reset(
      editing
        ? {
            name: editing.name,
            description: editing.description ?? '',
            icon: (editing.icon as HabitIcon) ?? 'sparkles',
            color: (editing.color as HabitColor) ?? 'accent',
            frequency: editing.frequency,
            target_count: editing.target_count,
            time_of_day: editing.time_of_day ?? 'anytime',
          }
        : DEFAULTS,
    )
  }, [open, editing, reset])

  const selectSimplePreset = (next: Exclude<Preset, 'custom'>) => {
    setValue('frequency', next)
    setValue('target_count', 1)
  }
  const selectCustom = () => {
    const base = preset === 'custom' ? values.target_count : 3
    setValue('frequency', 'every_n_days')
    setValue('target_count', clamp(base, UNIT_RANGE.days.min, UNIT_RANGE.days.max))
  }
  const selectUnit = (next: CustomUnit) => {
    setValue('frequency', UNIT_FREQ[next])
    setValue('target_count', clamp(values.target_count, UNIT_RANGE[next].min, UNIT_RANGE[next].max))
  }

  const onSubmit = handleSubmit(async (v) => {
    // Only the Custom cadences carry a meaningful count; presets are once-per.
    const isCustom = presetOf(v.frequency) === 'custom'
    const input = {
      name: v.name,
      description: v.description?.trim() || null,
      icon: v.icon,
      color: v.color,
      frequency: v.frequency,
      target_count: isCustom ? v.target_count : 1,
      time_of_day: v.time_of_day,
    }
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, input })
        toast.success('Habit updated')
      } else {
        await create.mutateAsync(input)
        toast.success('Habit created')
      }
      closeHabitForm()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save habit')
    }
  })

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => !next && closeHabitForm()}
      title={editing ? 'Edit habit' : 'New habit'}
      mono
      preventInitialFocus
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <label className="flex flex-col gap-1.5">
          <span className="label-mono">Name</span>
          <Input placeholder="Cold shower" {...register('name')} />
          {formState.errors.name ? (
            <span className="text-xs text-accent">{formState.errors.name.message}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="label-mono">Description</span>
          <Input placeholder="Optional" {...register('description')} />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="label-mono">Icon</span>
            <div className="flex flex-wrap gap-2">
              {HABIT_ICON_OPTIONS.map((key) => {
                const Icon = HABIT_ICONS[key]
                const active = values.icon === key
                return (
                  <button
                    key={key}
                    type="button"
                    aria-label={`Icon ${key}`}
                    aria-pressed={active}
                    onClick={() => setValue('icon', key)}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-tile border transition-colors',
                      active
                        ? 'border-accent bg-accent/15 text-accent'
                        : 'text-muted hover:text-foreground',
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="label-mono">Color</span>
            <div className="flex gap-2">
              {HABIT_COLOR_OPTIONS.map((key) => {
                const active = values.color === key
                return (
                  <button
                    key={key}
                    type="button"
                    aria-label={`Color ${key}`}
                    aria-pressed={active}
                    onClick={() => setValue('color', key)}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-tile border transition-transform',
                      active ? 'scale-105 border-foreground/40' : 'border-transparent',
                    )}
                  >
                    <span className={cn('h-5 w-5 rounded-[6px]', HABIT_COLORS[key].solid)} />
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl bg-surface p-4">
          <span className="label-mono">Repeats</span>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Repeats">
            {PRESETS.map((option) => {
              const active = preset === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    option.value === 'custom' ? selectCustom() : selectSimplePreset(option.value)
                  }
                  className={cn(
                    'rounded-tile border px-4 py-2.5 text-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                    active
                      ? 'border-transparent bg-accent text-on-accent'
                      : 'border-border text-muted hover:text-foreground',
                  )}
                >
                  {option.label}
                </button>
              )
            })}
          </div>

          {preset === 'custom' && (
            <div className="mt-1 flex items-center gap-3 rounded-2xl border border-accent/25 bg-bg-deep px-4 py-3">
              {unit !== 'per_week' ? <span className="text-sm font-medium">Every</span> : null}
              <Stepper
                value={values.target_count}
                onChange={(n) => setValue('target_count', n)}
                min={UNIT_RANGE[unit].min}
                max={UNIT_RANGE[unit].max}
              />
              <div className="ml-auto">
                <Dropdown
                  ariaLabel="Interval unit"
                  value={unit}
                  onChange={selectUnit}
                  options={UNIT_OPTIONS}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border/60 pt-4">
            <span className="label-mono normal-case">time of day</span>
            <Dropdown
              ariaLabel="Time of day"
              value={values.time_of_day}
              onChange={(next) => setValue('time_of_day', next)}
              options={TIME_OPTIONS}
            />
          </div>
        </div>

        <Button type="submit" size="lg" disabled={pending} className="mt-1">
          {pending ? 'Saving…' : editing ? 'Save changes' : 'Create habit'}
        </Button>

        {editing ? (
          <Button
            type="button"
            variant="ghost"
            className="text-accent"
            disabled={archive.isPending}
            onClick={async () => {
              try {
                await archive.mutateAsync(editing.id)
                toast.success('Habit archived')
                closeHabitForm()
              } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Could not archive')
              }
            }}
          >
            Archive habit
          </Button>
        ) : null}
      </form>
    </Sheet>
  )
}

interface StepperProps {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
}

function Stepper({ value, onChange, min, max }: StepperProps) {
  return (
    <div className="flex items-center gap-1 rounded-xl bg-surface px-1.5 py-1">
      <button
        type="button"
        aria-label="Decrease"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Minus className="h-4 w-4" aria-hidden="true" />
      </button>
      <span className="w-7 text-center font-mono tabular-nums">{value}</span>
      <button
        type="button"
        aria-label="Increase"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-accent transition-colors hover:text-accent-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}

interface DropdownProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
  ariaLabel: string
}

/** Small native-select dropdown styled to the spec-board "value ▾" look. */
function Dropdown<T extends string>({ value, onChange, options, ariaLabel }: DropdownProps<T>) {
  return (
    <div className="relative inline-flex items-center">
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="appearance-none rounded-lg bg-transparent pr-6 text-sm font-medium text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-surface text-foreground">
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-0 h-4 w-4 text-muted"
        aria-hidden="true"
      />
    </div>
  )
}
