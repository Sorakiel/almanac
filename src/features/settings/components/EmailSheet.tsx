import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet } from '@/components/ui/sheet'
import { useAccountActions } from '@/features/settings/hooks/useAccountActions'
import type { TranslationKey } from '@/i18n/types'
import { useT } from '@/hooks/useT'
import { toUserError } from '@/lib/userError'

interface EmailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  current: string
}

/**
 * Start an email change. Nothing switches here — the confirmation mail does
 * that — so the copy says so plainly rather than letting someone think the
 * new address already works for sign-in.
 */
export function EmailSheet({ open, onOpenChange, current }: EmailSheetProps) {
  const { t } = useT()
  const { changeEmail } = useAccountActions()
  const schema = useMemo(
    () =>
      z.object({
        email: z
          .string()
          .trim()
          .email('auth.emailInvalid')
          .refine((value) => value.toLowerCase() !== current.toLowerCase(), 'settings.emailSame'),
      }),
    [current],
  )
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit(async ({ email }) => {
    try {
      const pending = await changeEmail.mutateAsync(email)
      toast.success(t('settings.emailSent', { email: pending ?? email }))
      onOpenChange(false)
    } catch (error) {
      toast.error(toUserError(error, t, 'settings.emailFailed'))
    }
  })

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('settings.emailTitle')}
      description={t('settings.emailDescription')}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <span className="label-mono">{t('settings.emailCurrent')}</span>
          <p className="truncate rounded-tile border bg-surface px-3 py-2.5 text-sm text-muted">
            {current}
          </p>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="label-mono">{t('settings.emailNew')}</span>
          <Input type="email" autoComplete="email" autoFocus {...register('email')} />
          {errors.email?.message ? (
            <span className="text-xs text-accent">{t(errors.email.message as TranslationKey)}</span>
          ) : null}
        </label>
        <p className="text-xs text-muted">{t('settings.emailSecureHint')}</p>
        <Button type="submit" size="lg" disabled={changeEmail.isPending}>
          {changeEmail.isPending ? t('settings.emailSending') : t('settings.emailSend')}
        </Button>
      </form>
    </Sheet>
  )
}
