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
import { useT } from '@/hooks/useT'

const schema = z.object({
  body: z.string().trim().min(4, 'modulesPage.feedback.tooShort').max(1000),
})

type FormValues = z.infer<typeof schema>

interface FeedbackSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Free-text feedback box — ideas, bugs, module requests. Writes to `feedback`. */
export function FeedbackSheet({ open, onOpenChange }: FeedbackSheetProps) {
  const { t } = useT()
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
      toast.success(t('modulesPage.feedback.sent'))
      reset()
      onOpenChange(false)
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : t('modulesPage.feedback.failed')),
  })

  const onSubmit = handleSubmit((values) => send.mutate(values.body))

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('modulesPage.feedback.title')}
      description={t('modulesPage.feedback.description')}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <label className="flex flex-col gap-1.5">
          <span className="label-mono">{t('modulesPage.feedback.label')}</span>
          <Textarea
            placeholder={t('modulesPage.feedback.placeholder')}
            autoFocus
            {...register('body')}
          />
          {errors.body ? <span className="text-xs text-accent">{errors.body.message}</span> : null}
        </label>
        <Button type="submit" size="lg" disabled={send.isPending}>
          {send.isPending ? t('modulesPage.feedback.sending') : t('modulesPage.feedback.submit')}
        </Button>
      </form>
    </Sheet>
  )
}
