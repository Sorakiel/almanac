import { ConfirmSheet } from '@/components/common/ConfirmSheet'
import { useT } from '@/hooks/useT'

interface DeleteMemberConfirmProps {
  name: string
  open: boolean
  onOpenChange: (open: boolean) => void
  pending: boolean
  onConfirm: () => void
}

export function DeleteMemberConfirm({
  name,
  open,
  onOpenChange,
  pending,
  onConfirm,
}: DeleteMemberConfirmProps) {
  const { t } = useT()
  return (
    <ConfirmSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('admin.deleteTitle', { name })}
      description={t('admin.deleteBody')}
      confirmLabel={pending ? t('admin.deleting') : t('admin.deleteUser')}
      pending={pending}
      onConfirm={onConfirm}
    />
  )
}
