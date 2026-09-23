import { Users } from 'lucide-react'
import { RequestsList } from '@/features/social/components/RequestsList'
import { FriendsList } from '@/features/social/components/FriendsList'
import type { FriendsData } from '@/features/social/types'
import { useT } from '@/hooks/useT'
import { RailIdentity } from '@/components/rail/RailIdentity'

interface SocialRailProps {
  data: FriendsData
  onAccept: (friendshipId: string) => void
  onRemove: (friendshipId: string) => void
  busy: boolean
}

/** Desktop Friends context rail: request queue + the friend roster. */
export function SocialRail({ data, onAccept, onRemove, busy }: SocialRailProps) {
  const { t } = useT()
  return (
    <div className="flex flex-col gap-4">
      <RailIdentity
        icon={Users}
        title={t('social.yourCircle')}
        subtitle={t('social.friendsCount', { count: data.friends.length })}
      />

      <RequestsList
        incoming={data.incoming}
        outgoing={data.outgoing}
        onAccept={onAccept}
        onRemove={onRemove}
        busy={busy}
      />
      <FriendsList friends={data.friends} onRemove={onRemove} busy={busy} />
    </div>
  )
}
