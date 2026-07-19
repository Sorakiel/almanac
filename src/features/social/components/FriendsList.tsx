import { useState } from 'react'
import { UserMinus } from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'
import { Button } from '@/components/ui/button'
import { ConfirmSheet } from '@/components/common/ConfirmSheet'
import { SectionLabel } from '@/components/common/SectionLabel'
import type { Friend } from '@/features/social/types'

interface FriendsListProps {
  friends: Friend[]
  onRemove: (friendshipId: string) => void
  busy: boolean
}

/** Accepted friends, each removable with a confirmation step. */
export function FriendsList({ friends, onRemove, busy }: FriendsListProps) {
  const [pending, setPending] = useState<Friend | null>(null)

  return (
    <section className="flex flex-col gap-2">
      <SectionLabel accessory={String(friends.length)}>Friends</SectionLabel>
      {friends.length === 0 ? (
        <p className="rounded-card border border-dashed px-4 py-6 text-center text-sm text-muted">
          No friends yet — search above to add one.
        </p>
      ) : (
        friends.map((friend) => (
          <div key={friend.friendshipId} className="flex items-center gap-3 rounded-card border bg-surface px-4 py-3">
            <Avatar name={friend.displayName} size="sm" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{friend.displayName}</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 text-muted hover:text-foreground"
              aria-label={`Remove ${friend.displayName}`}
              onClick={() => setPending(friend)}
            >
              <UserMinus className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        ))
      )}

      <ConfirmSheet
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={pending ? `Remove ${pending.displayName}?` : ''}
        description="You'll stop seeing each other's activity. You can add them again later."
        confirmLabel="Remove friend"
        pending={busy}
        onConfirm={() => {
          if (pending) onRemove(pending.friendshipId)
          setPending(null)
        }}
      />
    </section>
  )
}
