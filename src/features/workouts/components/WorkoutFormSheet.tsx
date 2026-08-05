import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet } from '@/components/ui/sheet'
import { ConfirmSheet } from '@/components/common/ConfirmSheet'
import {
  RecurrencePicker,
  type RecurrenceValue,
} from '@/features/workouts/components/RecurrencePicker'
import { useWorkoutMutations } from '@/features/workouts/hooks/useWorkoutMutations'
import { useToday } from '@/hooks/useToday'
import type { Workout } from '@/features/workouts/types'
import { useT } from '@/hooks/useT'
import type { TranslationKey } from '@/i18n/types'

const schema = z.object({
  name: z.string().trim().min(1, 'workouts.form.nameRequired').max(80),
  scheduled_date: z.string(),
})

type FormValues = z.infer<typeof schema>

interface WorkoutFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set, the sheet edits this workout (and can delete it). */
  workout?: Workout | null
  /** Called after a successful delete (e.g. to navigate away from a detail page). */
  onDeleted?: () => void
}

/** Create or edit a workout — name, schedule, and optional date. */
export function WorkoutFormSheet({
  open,
  onOpenChange,
  workout,
  onDeleted,
}: WorkoutFormSheetProps) {
  const { t } = useT()
  const { create, update, remove } = useWorkoutMutations()
  const { dateKey } = useToday()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [recur, setRecur] = useState<RecurrenceValue>({
    recurrence: workout?.recurrence ?? 'none',
    days: workout?.recurrence_days ?? [],
    interval: workout?.recurrence_interval ?? null,
  })
  const isEdit = Boolean(workout)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: workout?.name ?? '',
      scheduled_date: workout?.scheduled_date ?? '',
    },
  })

  // The date field only applies to a one-off or the every-N-days anchor.
  const showDate = recur.recurrence === 'none' || recur.recurrence === 'every_n_days'
  const dateLabel =
    recur.recurrence === 'every_n_days' ? t('workouts.form.startDate') : t('workouts.form.date')

  const onSubmit = handleSubmit(async (values) => {
    if (recur.recurrence === 'weekdays' && recur.days.length === 0) {
      toast.error('workouts.form.pickWeekday')
      return
    }
    if (recur.recurrence === 'every_n_days' && (!recur.interval || recur.interval < 1)) {
      toast.error('workouts.form.setInterval')
      return
    }

    const scheduled_date =
      recur.recurrence === 'every_n_days'
        ? values.scheduled_date || dateKey
        : recur.recurrence === 'none'
          ? values.scheduled_date || null
          : null

    const input = {
      name: values.name,
      scheduled_date,
      recurrence: recur.recurrence,
      recurrence_days: recur.recurrence === 'weekdays' ? recur.days : null,
      recurrence_interval: recur.recurrence === 'every_n_days' ? recur.interval : null,
    }

    try {
      if (workout) {
        await update.mutateAsync({ id: workout.id, input })
        toast.success(t('workouts.form.updated'))
      } else {
        await create.mutateAsync(input)
        toast.success(t('workouts.form.added'))
      }
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('workouts.form.saveFailed'))
    }
  })

  const onDelete = async () => {
    if (!workout) return
    try {
      await remove.mutateAsync(workout.id)
      toast.success(t('workouts.form.removed'))
      setConfirmDelete(false)
      onOpenChange(false)
      onDeleted?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('workouts.form.removeFailed'))
    }
  }

  const pending = create.isPending || update.isPending

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={onOpenChange}
        title={isEdit ? t('workouts.form.editTitle') : t('workouts.form.addTitle')}
        description={isEdit ? undefined : t('workouts.form.addDescription')}
      >
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <label className="flex flex-col gap-1.5">
            <span className="label-mono">{t('workouts.form.name')}</span>
            <Input
              placeholder={t('workouts.form.namePlaceholder')}
              autoFocus
              {...register('name')}
            />
            {errors.name ? (
              <span className="text-xs text-accent">
                {t(errors.name.message as TranslationKey)}
              </span>
            ) : null}
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="label-mono">{t('workouts.form.repeat')}</span>
            <RecurrencePicker value={recur} onChange={setRecur} />
          </div>

          {showDate ? (
            <label className="flex flex-col gap-1.5">
              <span className="label-mono">{dateLabel}</span>
              <Input type="date" {...register('scheduled_date')} />
            </label>
          ) : null}

          <Button type="submit" size="lg" disabled={pending}>
            {pending
              ? t('workouts.form.saving')
              : isEdit
                ? t('workouts.form.save')
                : t('workouts.form.create')}
          </Button>

          {isEdit ? (
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="text-accent"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-4 w-4" />
              {t('workouts.form.remove')}
            </Button>
          ) : null}
        </form>
      </Sheet>

      <ConfirmSheet
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t('workouts.form.removeConfirm')}
        description={workout ? `"${workout.name}" and its exercises will be removed.` : undefined}
        confirmLabel={remove.isPending ? t('workouts.form.removing') : t('workouts.form.remove')}
        pending={remove.isPending}
        onConfirm={onDelete}
      />
    </>
  )
}
