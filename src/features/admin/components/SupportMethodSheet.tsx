import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Segmented } from '@/components/ui/segmented'
import { Sheet } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { ConfirmSheet } from '@/components/common/ConfirmSheet'
import { useSupportAdmin } from '@/features/admin/hooks/useSupportAdmin'
import type { SupportKind, SupportMethod } from '@/features/settings/lib/support'
import type { TranslationKey } from '@/i18n/types'
import { useT } from '@/hooks/useT'
import { toUserError } from '@/lib/userError'

const schema = z.object({
  label: z.string().trim().min(1, 'admin.methodNameRequired').max(40),
  hint: z.string().trim().max(80).optional(),
  network: z.string().trim().max(24).optional(),
  value: z.string().trim().max(240).optional(),
})

type FormValues = z.infer<typeof schema>

interface SupportMethodSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set, the sheet edits this method (and can delete it). */
  method?: SupportMethod | null
}

/** Owner: add or edit a donation method — kind, label, link/address, visibility. */
export function SupportMethodSheet({ open, onOpenChange, method }: SupportMethodSheetProps) {
  const { t } = useT()
  const { create, update, remove, isMutating } = useSupportAdmin(true)
  const [kind, setKind] = useState<SupportKind>(method?.kind ?? 'link')
  const [enabled, setEnabled] = useState(method?.enabled ?? true)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isEdit = Boolean(method)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: method?.label ?? '',
      hint: method?.hint ?? '',
      network: method?.network ?? '',
      value: method?.value ?? '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    const value = values.value?.trim() ?? ''
    if (kind === 'link' && value && !/^https?:\/\//i.test(value)) {
      setError('value', { message: 'admin.linkProtocol' })
      return
    }
    const input = {
      kind,
      label: values.label,
      hint: values.hint?.trim() ? values.hint.trim() : null,
      network: kind === 'crypto' && values.network?.trim() ? values.network.trim() : null,
      value,
      enabled,
    }
    try {
      if (method) {
        await update({ id: method.id, patch: input })
        toast.success(t('admin.methodUpdated'))
      } else {
        await create(input)
        toast.success(t('admin.methodAdded'))
      }
      onOpenChange(false)
    } catch (error) {
      toast.error(toUserError(error, t, 'admin.methodSaveFailed'))
    }
  })

  const onDelete = async () => {
    if (!method) return
    try {
      await remove(method.id)
      toast.success(t('admin.methodRemoved'))
      setConfirmDelete(false)
      onOpenChange(false)
    } catch (error) {
      toast.error(toUserError(error, t, 'admin.methodRemoveFailed'))
    }
  }

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={onOpenChange}
        title={isEdit ? t('admin.editMethod') : t('admin.addMethod')}
        description={isEdit ? undefined : t('admin.methodDescription')}
      >
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <span className="label-mono">{t('admin.methodType')}</span>
            <Segmented
              aria-label={t('admin.methodTypeAria')}
              value={kind}
              onChange={setKind}
              options={[
                { value: 'link', label: t('admin.kindLink') },
                { value: 'crypto', label: t('admin.kindCrypto') },
              ]}
            />
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="label-mono">{t('admin.methodName')}</span>
            <Input
              placeholder={t('admin.methodNamePlaceholder')}
              autoFocus
              {...register('label')}
            />
            {errors.label ? (
              <span className="text-xs text-accent">
                {t(errors.label.message as TranslationKey)}
              </span>
            ) : null}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="label-mono">{t('admin.methodHint')}</span>
            <Input placeholder={t('admin.methodHintPlaceholder')} {...register('hint')} />
          </label>

          {kind === 'crypto' ? (
            <label className="flex flex-col gap-1.5">
              <span className="label-mono">{t('admin.methodNetwork')}</span>
              <Input placeholder={t('admin.methodNetworkPlaceholder')} {...register('network')} />
            </label>
          ) : null}

          <label className="flex flex-col gap-1.5">
            <span className="label-mono">
              {kind === 'link' ? t('admin.methodUrl') : t('admin.methodWallet')}
            </span>
            <Input
              placeholder={kind === 'link' ? 'https://boosty.to/…' : 'UQ… / T…'}
              {...register('value')}
            />
            {errors.value ? (
              <span className="text-xs text-accent">
                {t(errors.value.message as TranslationKey)}
              </span>
            ) : (
              <span className="text-xs text-muted">{t('admin.methodBlankHint')}</span>
            )}
          </label>

          <label className="flex items-center justify-between rounded-tile border bg-surface px-4 py-3">
            <span className="min-w-0">
              <span className="block text-sm font-medium">{t('admin.methodVisible')}</span>
              <span className="block text-xs text-muted">{t('admin.methodVisibleHint')}</span>
            </span>
            <Switch
              checked={enabled}
              onCheckedChange={setEnabled}
              aria-label={t('admin.methodVisible')}
            />
          </label>

          <Button type="submit" size="lg" disabled={isMutating}>
            {isMutating
              ? t('admin.saving')
              : isEdit
                ? t('admin.saveChanges')
                : t('admin.addMethod')}
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
              {t('admin.removeMethod')}
            </Button>
          ) : null}
        </form>
      </Sheet>

      <ConfirmSheet
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t('admin.removeMethodTitle')}
        description={method ? t('admin.removeMethodBody', { name: method.label }) : undefined}
        confirmLabel={isMutating ? t('admin.removing') : t('admin.removeMethod')}
        pending={isMutating}
        onConfirm={onDelete}
      />
    </>
  )
}
