import { useState } from 'react'
import { Avatar } from '@/components/common/Avatar'
import { ConfirmSheet } from '@/components/common/ConfirmSheet'
import { ActivityFeed } from '@/features/social/components/ActivityFeed'
import { friendName } from '@/features/social/lib/format'
import type { FeedItem, Friend } from '@/features/social/types'
import { useT } from '@/hooks/useT'
import { intlLocale } from '@/lib/dateLocale'

interface FriendDetailProps {
  friend: Friend
  /** The shared feed; only this friend's events are shown. */
  feed: FeedItem[]
  todayKey: string
  busy: boolean
  onRemove: (friendshipId: string) => void
}

/** One friend in the desktop inspector: who, since when, what they did lately. */
export function FriendDetail({ friend, feed, todayKey, busy, onRemove }: FriendDetailProps) {
  const { t, locale } = useT()
  const [confirming, setConfirming] = useState(false)
  const name = friendName(friend, t)
  const since = new Intl.DateTimeFormat(intlLocale(locale), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(friend.since))
  const theirs = feed.filter((item) => item.friend.id === friend.id)

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col items-center gap-2 pt-2 text-center">
        <Avatar name={name} size="lg" />
        <h2 className="text-headline font-bold">{name}</h2>
        <p className="text-footnote text-muted">{t('social.friendSince', { date: since })}</p>
      </header>

      <section className="flex flex-col gap-2.5" aria-label={t('social.activity')}>
        <h3 className="mx-1.5 text-callout font-semibold text-muted">{t('social.activity')}</h3>
        <ActivityFeed feed={theirs} todayKey={todayKey} hasFriends />
      </section>

      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="min-h-12 rounded-card bg-surface px-4 text-body text-danger transition-colors hover:bg-foreground/5"
      >
        {t('social.removeFriend')}
      </button>

      <ConfirmSheet
        open={confirming}
        onOpenChange={setConfirming}
        title={t('social.removeNameConfirm', { name })}
        description={t('social.removeFriendHint')}
        confirmLabel={t('social.removeFriend')}
        pending={busy}
        onConfirm={() => {
          setConfirming(false)
          onRemove(friend.friendshipId)
        }}
      />
    </div>
  )
}
