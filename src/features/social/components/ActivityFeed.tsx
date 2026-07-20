import { BookOpen, CheckCircle2, Flame, Users, type LucideIcon } from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'
import { EmptyState } from '@/components/common/EmptyState'
import { activitySummary, feedDayLabel } from '@/features/social/lib/format'
import type { ActivityKind, FeedItem } from '@/features/social/types'

/** Icon + tint per event kind. */
const KIND_ICON: Record<ActivityKind, { icon: LucideIcon; tone: string }> = {
  day_completed: { icon: CheckCircle2, tone: 'text-teal' },
  streak_reached: { icon: Flame, tone: 'text-accent' },
  reading_progress: { icon: BookOpen, tone: 'text-amber' },
}

interface ActivityFeedProps {
  feed: FeedItem[]
  todayKey: string
  hasFriends: boolean
}

/** The friends activity feed — recent completions, newest first. */
export function ActivityFeed({ feed, todayKey, hasFriends }: ActivityFeedProps) {
  if (feed.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title={hasFriends ? 'No activity yet' : 'Add a friend to see their activity'}
        description={
          hasFriends
            ? 'When your friends complete habits, it shows up here.'
            : 'Search for a friend by name and send a request to get started.'
        }
      />
    )
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {feed.map((item) => {
        const { icon: Icon, tone } = KIND_ICON[item.kind]
        return (
          <li
            key={item.id}
            className="flex items-center gap-3 rounded-card border bg-surface px-4 py-3"
          >
            <Avatar name={item.friend.displayName} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">
                <span className="font-semibold">{item.friend.displayName}</span>{' '}
                <span className="text-muted">{activitySummary(item)}</span>
              </p>
              <p className="label-mono mt-0.5 text-[10px]">
                {feedDayLabel(item.eventDate, todayKey)}
              </p>
            </div>
            <Icon className={`h-4 w-4 shrink-0 ${tone}`} aria-hidden="true" />
          </li>
        )
      })}
    </ul>
  )
}
