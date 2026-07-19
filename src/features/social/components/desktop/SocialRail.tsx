import { Users } from 'lucide-react'
import { RequestsList } from '@/features/social/components/RequestsList'
import { FriendsList } from '@/features/social/components/FriendsList'
import type { FriendsData } from '@/features/social/types'

interface SocialRailProps {
  data: FriendsData
  onAccept: (friendshipId: string) => void
  onRemove: (friendshipId: string) => void
  busy: boolean
}

/** Desktop Friends context rail: request queue + the friend roster. */
export function SocialRail({ data, onAccept, onRemove, busy }: SocialRailProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-accent/15 text-accent"
        >
          <Users className="h-[18px] w-[18px]" />
        </span>
        <div>
          <p className="text-[15px] font-semibold">Your circle</p>
          <p className="font-mono text-[10px] text-muted-strong">
            {data.friends.length} friend{data.friends.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

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
