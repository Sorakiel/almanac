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

const NAME_MAX = 40

const schema = z.object({
  name: z.string().trim().min(1, 'settings.nameRequired').max(NAME_MAX, 'settings.nameTooLong'),
})

type FormValues = z.infer<typeof schema>

interface DisplayNameSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  current: string
}

/** Rename yourself — the profile row for friends, the session for this device. */
export function DisplayNameSheet({ open, onOpenChange, current }: DisplayNameSheetProps) {
  const { t } = useT()
  const { rename } = useAccountActions()
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: current } })

  const onSubmit = handleSubmit(async ({ name }) => {
    try {
      await rename.mutateAsync(name)
      toast.success(t('settings.nameSaved'))
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('settings.nameFailed'))
    }
  })

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('settings.displayName')}
      description={t('settings.nameDescription')}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <label className="flex flex-col gap-1.5">
          <span className="label-mono">{t('settings.nameLabel')}</span>
          <Input autoComplete="name" autoFocus maxLength={NAME_MAX} {...register('name')} />
          {errors.name?.message ? (
            <span className="text-xs text-accent">
              {t(errors.name.message as TranslationKey, { max: NAME_MAX })}
            </span>
          ) : null}
        </label>
        <Button type="submit" size="lg" disabled={rename.isPending || !isDirty}>
          {rename.isPending ? t('settings.saving') : t('settings.nameSave')}
        </Button>
      </form>
    </Sheet>
  )
}
