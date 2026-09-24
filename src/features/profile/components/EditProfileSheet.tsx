import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { Sheet } from '@/components/ui/sheet'
import { useEditProfile } from '@/features/profile/hooks/useEditProfile'
import {
  AVATAR_COLORS,
  avatarBackground,
  monogram,
  type AvatarColor,
} from '@/features/profile/lib/avatarColors'
import type { TranslationKey } from '@/i18n/types'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'
import { toUserError } from '@/lib/userError'

const NAME_MAX = 40

const schema = z.object({
  name: z.string().trim().min(1, 'settings.nameRequired').max(NAME_MAX, 'settings.nameTooLong'),
  color: z.enum(AVATAR_COLORS),
})

type FormValues = z.infer<typeof schema>

interface EditProfileSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  name: string
  email: string
  color: AvatarColor
}

const FIELD =
  'h-[50px] w-full rounded-control bg-sheet-fill px-3.5 text-body text-foreground focus:outline-none focus:ring-2 focus:ring-accent'
const LABEL = 'mx-1 mb-2 mt-4 block text-footnote font-medium text-muted'

/** "Изменить профиль": the avatar colour and the one name friends see. */
export function EditProfileSheet({
  open,
  onOpenChange,
  name,
  email,
  color,
}: EditProfileSheetProps) {
  const { t } = useT()
  const save = useEditProfile()
  const { register, handleSubmit, watch, setValue, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name, color },
  })
  const draftName = watch('name')
  const draftColor = watch('color')

  const onSubmit = handleSubmit(async (values) => {
    try {
      await save.mutateAsync({
        name: values.name,
        color: values.color,
        nameChanged: values.name !== name,
      })
      onOpenChange(false)
    } catch (error) {
      toast.error(toUserError(error, t, 'profile.saveFailed'))
    }
  })

  const nameError = formState.errors.name?.message

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t('profile.editTitle')}>
      <form onSubmit={onSubmit} noValidate>
        <div className="mb-2.5 mt-1.5 grid justify-items-center gap-2.5">
          <span
            aria-hidden="true"
            className="grid h-24 w-24 place-items-center rounded-full text-[38px] font-semibold text-white transition-[background] duration-300"
            style={{ background: avatarBackground(draftColor) }}
          >
            {monogram(draftName)}
          </span>
          <div role="radiogroup" aria-label={t('profile.colors')} className="flex gap-2.5">
            {AVATAR_COLORS.map((c, i) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={draftColor === c}
                aria-label={t('profile.color', { n: i + 1 })}
                onClick={() => setValue('color', c, { shouldDirty: true })}
                className={cn(
                  'h-[34px] w-[34px] rounded-full border-[3px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sheet',
                  draftColor === c ? 'border-foreground' : 'border-transparent',
                )}
                style={{ background: avatarBackground(c) }}
              />
            ))}
          </div>
        </div>

        <label>
          <span className={LABEL}>{t('settings.nameLabel')}</span>
          <input className={FIELD} autoComplete="name" maxLength={NAME_MAX} {...register('name')} />
        </label>
        {nameError ? (
          <p className="mx-1 mt-1.5 text-footnote text-danger">
            {t(nameError as TranslationKey, { max: NAME_MAX })}
          </p>
        ) : (
          <p className="mx-1 mt-2 text-footnote leading-snug text-muted">{t('profile.nameNote')}</p>
        )}

        <label>
          <span className={LABEL}>{t('settings.email')}</span>
          <input className={cn(FIELD, 'opacity-60')} value={email} disabled readOnly />
        </label>

        <button
          type="submit"
          disabled={save.isPending || !formState.isDirty}
          className="mt-[18px] h-[52px] w-full rounded-[26px] bg-accent-solid text-body font-semibold text-on-accent-solid transition-opacity disabled:opacity-40"
        >
          {save.isPending ? t('settings.saving') : t('profile.save')}
        </button>
      </form>
    </Sheet>
  )
}
