import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Minus, Plus } from 'lucide-react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Segmented } from '@/components/ui/segmented'
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
import { useUiStore } from '@/stores/ui'
import { cn } from '@/lib/utils'

const schema = z.object({
  name: z.string().trim().min(1, 'Give it a name').max(60),
  description: z.string().trim().max(160).optional(),
  icon: z.enum(HABIT_ICON_OPTIONS as [HabitIcon, ...HabitIcon[]]),
  color: z.enum(HABIT_COLOR_OPTIONS as [HabitColor, ...HabitColor[]]),
  frequency: z.enum(['daily', 'weekly', 'x_per_week']),
  target_count: z.number().int().min(1).max(50),
})

type FormValues = z.infer<typeof schema>

const DEFAULTS: FormValues = {
  name: '',
  description: '',
  icon: 'sparkles',
  color: 'accent',
  frequency: 'daily',
  target_count: 1,
}

/** Create/edit bottom sheet with icon, color, frequency, and target pickers. */
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

  useEffect(() => {
    if (!open) return
    reset(
      editing
        ? {
            name: editing.name,
            description: editing.description ?? '',
            icon: (editing.icon as HabitIcon) ?? 'sparkles',
            color: (editing.color as HabitColor) ?? 'accent',
            frequency: editing.frequency,
            target_count: editing.target_count,
          }
        : DEFAULTS,
    )
  }, [open, editing, reset])

  const onSubmit = handleSubmit(async (v) => {
    const input = {
      name: v.name,
      description: v.description?.trim() || null,
      icon: v.icon,
      color: v.color,
      frequency: v.frequency,
      target_count: v.frequency === 'x_per_week' ? v.target_count : 1,
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
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <label className="flex flex-col gap-1.5">
          <span className="label-mono">Name</span>
          <Input placeholder="Cold shower" autoFocus {...register('name')} />
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
                      active ? 'border-accent bg-accent/15 text-accent' : 'text-muted hover:text-foreground',
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
                      active ? 'border-foreground/40 scale-105' : 'border-transparent',
                    )}
                  >
                    <span className={cn('h-5 w-5 rounded-full', HABIT_COLORS[key].solid)} />
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="label-mono">Frequency</span>
          <Segmented
            aria-label="Frequency"
            value={values.frequency}
            onChange={(f) => setValue('frequency', f)}
            options={[
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'x_per_week', label: 'N× / wk' },
            ]}
          />
        </div>

        {values.frequency === 'x_per_week' && (
          <div className="flex items-center justify-between rounded-2xl border px-4 py-2">
            <span className="text-sm font-medium">Target per week</span>
            <Stepper
              value={values.target_count}
              onChange={(n) => setValue('target_count', n)}
              min={1}
              max={50}
            />
          </div>
        )}

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
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label="Decrease"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-8 w-8 items-center justify-center rounded-full border text-muted hover:text-foreground"
      >
        <Minus className="h-4 w-4" aria-hidden="true" />
      </button>
      <span className="w-6 text-center font-mono tabular-nums">{value}</span>
      <button
        type="button"
        aria-label="Increase"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-8 w-8 items-center justify-center rounded-full border text-muted hover:text-foreground"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}
