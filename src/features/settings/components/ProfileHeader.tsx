import { Avatar } from '@/components/common/Avatar'
import { Tag } from '@/components/common/Tag'
import type { Profile } from '@/features/settings/api/profiles.api'
import { useT } from '@/hooks/useT'

interface ProfileHeaderProps {
  name: string
  email: string
  role: Profile['role'] | undefined
  joinedDays: number
}

/** Who you are, at the top of Settings: avatar, name, email, role · tenure. */
export function ProfileHeader({ name, email, role, joinedDays }: ProfileHeaderProps) {
  const { t } = useT()
  const roleLabel =
    role === 'owner' ? t('rail.owner') : role === 'admin' ? t('rail.admin') : t('settings.member')
  return (
    <header className="flex items-center gap-4">
      <Avatar name={name} size="lg" />
      <div className="min-w-0">
        <h1 className="truncate text-xl">{name}</h1>
        <p className="truncate text-sm text-muted">{email}</p>
        <Tag tone="accent" className="mt-1.5">
          ◇ {roleLabel} · {t('settings.joined', { count: joinedDays })}
        </Tag>
      </div>
    </header>
  )
}
