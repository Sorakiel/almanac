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
import { useWorkoutMutations } from '@/features/workouts/hooks/useWorkoutMutations'
import type { Workout } from '@/features/workouts/types'

const schema = z.object({
  name: z.string().trim().min(1, 'Give the session a name').max(80),
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

/** Create or edit a workout — name + optional scheduled date. */
export function WorkoutFormSheet({
  open,
  onOpenChange,
  workout,
  onDeleted,
}: WorkoutFormSheetProps) {
  const { create, update, remove } = useWorkoutMutations()
  const [confirmDelete, setConfirmDelete] = useState(false)
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

  const onSubmit = handleSubmit(async (values) => {
    const input = { name: values.name, scheduled_date: values.scheduled_date || null }
    try {
      if (workout) {
        await update.mutateAsync({ id: workout.id, input })
        toast.success('Workout updated')
      } else {
        await create.mutateAsync(input)
        toast.success('Workout added')
      }
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save the workout')
    }
  })

  const onDelete = async () => {
    if (!workout) return
    try {
      await remove.mutateAsync(workout.id)
      toast.success('Workout deleted')
      setConfirmDelete(false)
      onOpenChange(false)
      onDeleted?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete the workout')
    }
  }

  const pending = create.isPending || update.isPending

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={onOpenChange}
        title={isEdit ? 'Edit workout' : 'New workout'}
        description={isEdit ? undefined : 'Plan a training session — add exercises next.'}
      >
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <label className="flex flex-col gap-1.5">
            <span className="label-mono">Name</span>
            <Input placeholder="e.g. Push day" autoFocus {...register('name')} />
            {errors.name ? (
              <span className="text-xs text-accent">{errors.name.message}</span>
            ) : null}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="label-mono">Scheduled date (optional)</span>
            <Input type="date" {...register('scheduled_date')} />
          </label>

          <Button type="submit" size="lg" disabled={pending}>
            {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Add workout'}
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
              Delete workout
            </Button>
          ) : null}
        </form>
      </Sheet>

      <ConfirmSheet
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this workout?"
        description={workout ? `"${workout.name}" and its exercises will be removed.` : undefined}
        confirmLabel={remove.isPending ? 'Deleting…' : 'Delete workout'}
        pending={remove.isPending}
        onConfirm={onDelete}
      />
    </>
  )
}
