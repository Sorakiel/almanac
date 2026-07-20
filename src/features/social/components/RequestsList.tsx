import { Check, Clock, X } from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'
import { Button } from '@/components/ui/button'
import { SectionLabel } from '@/components/common/SectionLabel'
import type { FriendRequest } from '@/features/social/types'

interface RequestsListProps {
  incoming: FriendRequest[]
  outgoing: FriendRequest[]
  onAccept: (friendshipId: string) => void
  onRemove: (friendshipId: string) => void
  busy: boolean
}

/** Pending friend requests — incoming (accept/decline) and outgoing (cancel). */
export function RequestsList({ incoming, outgoing, onAccept, onRemove, busy }: RequestsListProps) {
  if (incoming.length === 0 && outgoing.length === 0) return null

  return (
    <div className="flex flex-col gap-4">
      {incoming.length > 0 ? (
        <section className="flex flex-col gap-2">
          <SectionLabel>Requests · {incoming.length}</SectionLabel>
          {incoming.map((req) => (
            <div
              key={req.friendshipId}
              className="flex items-center gap-3 rounded-card border bg-surface px-4 py-3"
            >
              <Avatar name={req.profile.displayName} size="sm" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {req.profile.displayName}
              </span>
              <Button
                size="icon"
                variant="primary"
                className="h-9 w-9"
                aria-label="Accept"
                disabled={busy}
                onClick={() => onAccept(req.friendshipId)}
              >
                <Check className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                size="icon"
                variant="surface"
                className="h-9 w-9"
                aria-label="Decline"
                disabled={busy}
                onClick={() => onRemove(req.friendshipId)}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          ))}
        </section>
      ) : null}

      {outgoing.length > 0 ? (
        <section className="flex flex-col gap-2">
          <SectionLabel>Sent · {outgoing.length}</SectionLabel>
          {outgoing.map((req) => (
            <div
              key={req.friendshipId}
              className="flex items-center gap-3 rounded-card border bg-surface px-4 py-3"
            >
              <Avatar name={req.profile.displayName} size="sm" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {req.profile.displayName}
              </span>
              <span className="label-mono flex items-center gap-1 text-[10px]">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" /> Pending
              </span>
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => onRemove(req.friendshipId)}
              >
                Cancel
              </Button>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  )
}
