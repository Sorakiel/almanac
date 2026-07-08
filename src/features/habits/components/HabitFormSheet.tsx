import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet } from '@/components/ui/sheet'
import { useHabits } from '@/features/habits/hooks/useHabits'
import { useHabitMutations } from '@/features/habits/hooks/useHabitMutations'
import { useUiStore } from '@/stores/ui'
import { cn } from '@/lib/utils'

const schema = z.object({
  name: z.string().trim().min(1, 'Give it a name').max(60),
  description: z.string().trim().max(160).optional(),
  frequency: z.enum(['daily', 'weekly', 'x_per_week']),
  target_count: z.number({ message: 'Enter a number' }).int().min(1, 'At least 1').max(50),
})

type FormValues = z.infer<typeof schema>

const FREQUENCY_OPTIONS: { value: FormValues['frequency']; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'x_per_week', label: 'Times / week' },
]

const DEFAULTS: FormValues = { name: '', description: '', frequency: 'daily', target_count: 1 }

/** Create/edit sheet, driven by the global UI store so any surface can open it. */
export function HabitFormSheet() {
  const habitForm = useUiStore((s) => s.habitForm)
  const closeHabitForm = useUiStore((s) => s.closeHabitForm)
  const { habits } = useHabits()
  const { create, update, archive } = useHabitMutations()

  const editing = habitForm && habitForm !== 'new' ? habits.find((h) => h.id === habitForm) : null
  const open = habitForm !== null

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: DEFAULTS })

  // Sync the form to whatever is being edited whenever the sheet opens.
  useEffect(() => {
    if (!open) return
    reset(
      editing
        ? {
            name: editing.name,
            description: editing.description ?? '',
            frequency: editing.frequency,
            target_count: editing.target_count,
          }
        : DEFAULTS,
    )
  }, [open, editing, reset])

  const frequency = useWatch({ control, name: 'frequency' })
  const pending = create.isPending || update.isPending

  const onSubmit = handleSubmit(async (values) => {
    const input = {
      name: values.name,
      description: values.description?.trim() || null,
      frequency: values.frequency,
      target_count: values.frequency === 'x_per_week' ? values.target_count : 1,
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
          <Label asChild>
            <span>Name</span>
          </Label>
          <Input placeholder="Drink water" autoFocus {...register('name')} />
          {errors.name ? <span className="text-xs text-accent">{errors.name.message}</span> : null}
        </label>

        <label className="flex flex-col gap-1.5">
          <Label asChild>
            <span>Description</span>
          </Label>
          <Input placeholder="Optional" {...register('description')} />
        </label>

        <div className="flex flex-col gap-1.5">
          <Label asChild>
            <span>Frequency</span>
          </Label>
          <div className="flex gap-2">
            {FREQUENCY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setValue('frequency', option.value)}
                className={cn(
                  'flex-1 rounded-2xl border px-3 py-2 text-sm transition-colors',
                  frequency === option.value
                    ? 'border-accent bg-accent text-on-accent'
                    : 'border-border text-muted hover:text-foreground',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {frequency === 'x_per_week' && (
          <label className="flex flex-col gap-1.5">
            <Label asChild>
              <span>Target per week</span>
            </Label>
            <Input
              type="number"
              min={1}
              max={50}
              {...register('target_count', { valueAsNumber: true })}
            />
            {errors.target_count ? (
              <span className="text-xs text-accent">{errors.target_count.message}</span>
            ) : null}
          </label>
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
