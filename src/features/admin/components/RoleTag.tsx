import { Tag } from '@/components/common/Tag'
import type { UserRole } from '@/features/admin/types'
import { useT } from '@/hooks/useT'

const ROLE_TONE: Record<UserRole, 'accent' | 'muted' | 'teal'> = {
  owner: 'teal',
  admin: 'accent',
  user: 'muted',
}

export function RoleTag({ role, className }: { role: UserRole; className?: string }) {
  const { t } = useT()
  return (
    <Tag tone={ROLE_TONE[role]} className={className}>
      {t(`admin.roles.${role}`)}
    </Tag>
  )
}
