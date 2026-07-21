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

const schema = z.object({
  label: z.string().trim().min(1, 'Give it a name').max(40),
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
      setError('value', { message: 'Links must start with http:// or https://' })
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
        toast.success('Method updated')
      } else {
        await create(input)
        toast.success('Method added')
      }
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save the method')
    }
  })

  const onDelete = async () => {
    if (!method) return
    try {
      await remove(method.id)
      toast.success('Method removed')
      setConfirmDelete(false)
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not remove the method')
    }
  }

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={onOpenChange}
        title={isEdit ? 'Edit method' : 'Add method'}
        description={isEdit ? undefined : 'A donation option users see in Support Almanac.'}
      >
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <span className="label-mono">Type</span>
            <Segmented
              aria-label="Method type"
              value={kind}
              onChange={setKind}
              options={[
                { value: 'link', label: 'Link' },
                { value: 'crypto', label: 'Crypto' },
              ]}
            />
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="label-mono">Name</span>
            <Input placeholder="e.g. Boosty" autoFocus {...register('label')} />
            {errors.label ? <span className="text-xs text-accent">{errors.label.message}</span> : null}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="label-mono">Hint (optional)</span>
            <Input placeholder="e.g. One-off tip or monthly support" {...register('hint')} />
          </label>

          {kind === 'crypto' ? (
            <label className="flex flex-col gap-1.5">
              <span className="label-mono">Network (optional)</span>
              <Input placeholder="e.g. TON" {...register('network')} />
            </label>
          ) : null}

          <label className="flex flex-col gap-1.5">
            <span className="label-mono">{kind === 'link' ? 'URL' : 'Wallet address'}</span>
            <Input
              placeholder={kind === 'link' ? 'https://boosty.to/…' : 'UQ… / T…'}
              {...register('value')}
            />
            {errors.value ? (
              <span className="text-xs text-accent">{errors.value.message}</span>
            ) : (
              <span className="text-xs text-muted">
                Leave blank to show it as “coming soon”.
              </span>
            )}
          </label>

          <label className="flex items-center justify-between rounded-tile border bg-surface px-4 py-3">
            <span className="min-w-0">
              <span className="block text-sm font-medium">Visible to users</span>
              <span className="block text-xs text-muted">Off keeps it hidden from the sheet.</span>
            </span>
            <Switch checked={enabled} onCheckedChange={setEnabled} aria-label="Visible to users" />
          </label>

          <Button type="submit" size="lg" disabled={isMutating}>
            {isMutating ? 'Saving…' : isEdit ? 'Save changes' : 'Add method'}
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
              Remove method
            </Button>
          ) : null}
        </form>
      </Sheet>

      <ConfirmSheet
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Remove this method?"
        description={method ? `"${method.label}" will no longer appear in Support Almanac.` : undefined}
        confirmLabel={isMutating ? 'Removing…' : 'Remove method'}
        pending={isMutating}
        onConfirm={onDelete}
      />
    </>
  )
}
