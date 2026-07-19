import { AddFriend } from '@/features/social/components/AddFriend'
import { ActivityFeed } from '@/features/social/components/ActivityFeed'
import type { FeedItem, FriendsData } from '@/features/social/types'

interface SocialWorkspaceProps {
  data: FriendsData
  feed: FeedItem[]
  todayKey: string
  selfId: string
  connectedIds: Set<string>
  onAdd: (userId: string) => void
  isAdding: boolean
}

/** Desktop "Friends" workspace — add-a-friend plus the activity feed. */
export function SocialWorkspace({
  data,
  feed,
  todayKey,
  selfId,
  connectedIds,
  onAdd,
  isAdding,
}: SocialWorkspaceProps) {
  return (
    <div className="mx-auto max-w-[720px]">
      <header className="mb-7">
        <p className="label-mono">// your circle</p>
        <h1 className="mt-1.5 text-[44px] leading-none tracking-title">Friends</h1>
        <p className="mt-2 text-[15px] text-muted">
          Keep a small circle honest — see when friends close their day.
        </p>
      </header>

      <div className="flex flex-col gap-6">
        <AddFriend connectedIds={connectedIds} selfId={selfId} onAdd={onAdd} isAdding={isAdding} />
        <section className="flex flex-col gap-3">
          <p className="label-mono">// activity</p>
          <ActivityFeed feed={feed} todayKey={todayKey} hasFriends={data.friends.length > 0} />
        </section>
      </div>
    </div>
  )
}
