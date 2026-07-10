import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { submitFeedback } from '@/features/modules/api/feedback.api'
import { useSession } from '@/hooks/useSession'

const schema = z.object({
  body: z.string().trim().min(4, 'Tell us a little more').max(1000),
})

type FormValues = z.infer<typeof schema>

interface SuggestModuleSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Free-text suggestion box — writes to the feedback table. */
export function SuggestModuleSheet({ open, onOpenChange }: SuggestModuleSheetProps) {
  const { user } = useSession()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const send = useMutation({
    mutationFn: (body: string) => submitFeedback(user?.id ?? '', body),
    onSuccess: () => {
      toast.success('Suggestion sent — thank you!')
      reset()
      onOpenChange(false)
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : 'Could not send your suggestion'),
  })

  const onSubmit = handleSubmit((values) => send.mutate(values.body))

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Suggest a module"
      description="What should Almanac learn to track next?"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <label className="flex flex-col gap-1.5">
          <span className="label-mono">Your idea</span>
          <Textarea
            placeholder="e.g. A mood tracker with a weekly chart…"
            autoFocus
            {...register('body')}
          />
          {errors.body ? <span className="text-xs text-accent">{errors.body.message}</span> : null}
        </label>
        <Button type="submit" size="lg" disabled={send.isPending}>
          {send.isPending ? 'Sending…' : 'Send suggestion'}
        </Button>
      </form>
    </Sheet>
  )
}
