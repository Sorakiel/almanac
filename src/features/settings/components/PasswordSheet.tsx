import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet } from '@/components/ui/sheet'
import { PasswordStrengthMeter } from '@/features/auth/components/PasswordStrengthMeter'
import { useAccountActions } from '@/features/settings/hooks/useAccountActions'
import type { TranslationKey } from '@/i18n/types'
import { useT } from '@/hooks/useT'

/** Same floor as sign-up, so a changed password is never weaker than a new one. */
const PASSWORD_MIN = 6

const schema = z
  .object({
    password: z.string().min(PASSWORD_MIN, 'auth.passwordTooShort'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: 'settings.passwordMismatch',
    path: ['confirm'],
  })

type FormValues = z.infer<typeof schema>

interface PasswordSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** New password + repeat, with the sign-up strength meter reading as you type. */
export function PasswordSheet({ open, onOpenChange }: PasswordSheetProps) {
  const { t } = useT()
  const { setPassword } = useAccountActions()
  const [visible, setVisible] = useState(false)
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { password: '' } })
  const password = useWatch({ control, name: 'password' }) ?? ''

  const onSubmit = handleSubmit(async (values) => {
    try {
      await setPassword.mutateAsync(values.password)
      toast.success(t('settings.passwordSaved'))
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('settings.passwordFailed'))
    }
  })

  const type = visible ? 'text' : 'password'
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('settings.passwordTitle')}
      description={t('settings.passwordDescription')}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <label className="flex flex-col gap-1.5">
          <span className="label-mono">{t('settings.passwordNew')}</span>
          <div className="relative">
            <Input
              type={type}
              autoComplete="new-password"
              autoFocus
              className="pr-16"
              placeholder={t('auth.passwordPlaceholder')}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              aria-pressed={visible}
              className="absolute inset-y-0 right-1 my-auto h-9 rounded-lg px-3 font-mono text-[10px] uppercase tracking-label text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {visible ? t('auth.hide') : t('auth.show')}
            </button>
          </div>
          {errors.password?.message ? (
            <span className="text-xs text-accent">
              {t(errors.password.message as TranslationKey)}
            </span>
          ) : null}
        </label>

        {password ? <PasswordStrengthMeter password={password} /> : null}

        <label className="flex flex-col gap-1.5">
          <span className="label-mono">{t('settings.passwordConfirm')}</span>
          <Input type={type} autoComplete="new-password" {...register('confirm')} />
          {errors.confirm?.message ? (
            <span className="text-xs text-accent">
              {t(errors.confirm.message as TranslationKey)}
            </span>
          ) : null}
        </label>

        <Button type="submit" size="lg" disabled={setPassword.isPending}>
          {setPassword.isPending ? t('settings.saving') : t('settings.passwordSave')}
        </Button>
      </form>
    </Sheet>
  )
}
