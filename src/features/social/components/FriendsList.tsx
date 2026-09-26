import { useState } from 'react'
import { ChevronRight, UserMinus } from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'
import { Button } from '@/components/ui/button'
import { ConfirmSheet } from '@/components/common/ConfirmSheet'
import { SectionLabel } from '@/components/common/SectionLabel'
import type { Friend } from '@/features/social/types'
import { friendName } from '@/features/social/lib/format'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'

interface FriendsListProps {
  friends: Friend[]
  onRemove: (friendshipId: string) => void
  busy: boolean
  /** Desktop: a row opens the friend in the inspector, which carries the remove. */
  onOpen?: (friend: Friend) => void
  selectedId?: string | null
}

/** Accepted friends, each removable with a confirmation step. */
export function FriendsList({ friends, onRemove, busy, onOpen, selectedId }: FriendsListProps) {
  const { t } = useT()
  const [pending, setPending] = useState<Friend | null>(null)

  return (
    <section className="flex flex-col gap-2">
      <SectionLabel accessory={String(friends.length)}>{t('social.title')}</SectionLabel>
      {friends.length === 0 ? (
        <p className="rounded-card border border-dashed px-4 py-6 text-center text-sm text-muted">
          {t('social.noFriendsYet')}
        </p>
      ) : (
        friends.map((friend) =>
          onOpen ? (
            <button
              key={friend.friendshipId}
              type="button"
              onClick={() => onOpen(friend)}
              aria-expanded={friend.id === selectedId}
              className={cn(
                'flex items-center gap-3 rounded-card border bg-surface px-4 py-3 text-left transition-colors hover:border-accent/30',
                friend.id === selectedId && 'border-accent/40 bg-accent/10',
              )}
            >
              <Avatar name={friendName(friend, t)} size="sm" />
              <span className="min-w-0 flex-1 truncate text-callout font-medium">
                {friendName(friend, t)}
              </span>
              <ChevronRight className="h-4 w-4 flex-none text-muted-strong" aria-hidden="true" />
            </button>
          ) : (
            <div
              key={friend.friendshipId}
              className="flex items-center gap-3 rounded-card border bg-surface px-4 py-3"
            >
              <Avatar name={friendName(friend, t)} size="sm" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {friendName(friend, t)}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 text-muted hover:text-foreground"
                aria-label={t('social.removeName', { name: friendName(friend, t) })}
                onClick={() => setPending(friend)}
              >
                <UserMinus className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          ),
        )
      )}

      <ConfirmSheet
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={pending ? t('social.removeNameConfirm', { name: friendName(pending, t) }) : ''}
        description={t('social.removeFriendHint')}
        confirmLabel={t('social.removeFriend')}
        pending={busy}
        onConfirm={() => {
          if (pending) onRemove(pending.friendshipId)
          setPending(null)
        }}
      />
    </section>
  )
}
