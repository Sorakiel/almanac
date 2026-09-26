import { Cascade } from '@/components/common/Cascade'
import { AddFriend } from '@/features/social/components/AddFriend'
import { ActivityFeed } from '@/features/social/components/ActivityFeed'
import { FriendsList } from '@/features/social/components/FriendsList'
import { RequestsList } from '@/features/social/components/RequestsList'
import type { FeedItem, Friend, FriendsData } from '@/features/social/types'
import { useT } from '@/hooks/useT'

interface SocialWorkspaceProps {
  data: FriendsData
  feed: FeedItem[]
  todayKey: string
  selfId: string
  connectedIds: Set<string>
  onAdd: (userId: string) => void
  isAdding: boolean
  onAccept: (friendshipId: string) => void
  onRemove: (friendshipId: string) => void
  busy: boolean
  /** The friend open in the inspector, if any. */
  selectedId: string | null
  onOpen: (friend: Friend) => void
}

/**
 * Desktop "Friends" workspace — add a friend, answer requests, the activity
 * feed, then the circle; a friend opens in the inspector.
 */
export function SocialWorkspace({
  data,
  feed,
  todayKey,
  selfId,
  connectedIds,
  onAdd,
  isAdding,
  onAccept,
  onRemove,
  busy,
  selectedId,
  onOpen,
}: SocialWorkspaceProps) {
  const { t } = useT()
  return (
    <div className="mx-auto max-w-[720px]">
      <header className="mb-7">
        <p className="label-mono">{t('social.yourCircleLower')}</p>
        <h1 className="mt-1.5 text-[44px] leading-none tracking-title">{t('social.title')}</h1>
        <p className="mt-2 text-[15px] text-muted">{t('social.subtitle')}</p>
      </header>

      <div className="flex flex-col gap-6">
        <Cascade>
          <AddFriend
            connectedIds={connectedIds}
            selfId={selfId}
            onAdd={onAdd}
            isAdding={isAdding}
          />
          <RequestsList
            incoming={data.incoming}
            outgoing={data.outgoing}
            onAccept={onAccept}
            onRemove={onRemove}
            busy={busy}
          />
          <section className="flex flex-col gap-3">
            <p className="label-mono">{t('social.activity')}</p>
            <ActivityFeed feed={feed} todayKey={todayKey} hasFriends={data.friends.length > 0} />
          </section>
          <FriendsList
            friends={data.friends}
            onRemove={onRemove}
            busy={busy}
            onOpen={onOpen}
            selectedId={selectedId}
          />
        </Cascade>
      </div>
    </div>
  )
}
