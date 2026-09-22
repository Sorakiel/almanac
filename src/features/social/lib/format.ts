import { dateFromKey, daysBetween } from '@/lib/date'
import type { Locale } from '@/i18n'
import type { FeedItem, FriendProfile } from '@/features/social/types'
import type { TFunction } from '@/hooks/useT'

/** Day-relative label for a feed row: Today / Yesterday / "8 Jul". */
export function feedDayLabel(
  eventDate: string,
  todayKey: string,
  t: TFunction,
  locale: Locale,
): string {
  if (eventDate === todayKey) return t('social.today')
  if (daysBetween(eventDate, todayKey) === 1) return t('social.yesterday')
  const date = dateFromKey(eventDate)
  if (Number.isNaN(date.getTime())) return eventDate
  // The key was parsed at UTC midnight, so format it in UTC too or it slips a day west.
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(date)
}

/** One-line summary of what a friend did — privacy-safe, never a habit/book name. */
export function activitySummary(item: FeedItem, t: TFunction): string {
  switch (item.kind) {
    case 'day_completed':
      return item.done !== null && item.total !== null
        ? t('social.feed.closedDayRatio', { done: item.done, total: item.total })
        : t('social.feed.closedDay')
    case 'streak_reached':
      return item.days !== null
        ? t('social.feed.streak', { count: item.days })
        : t('social.feed.hitStreak')
    case 'reading_progress':
      if (item.units === null) return t('social.feed.readToday')
      return item.unit === 'chapters'
        ? t('social.feed.readChapters', { count: item.units })
        : t('social.feed.readPages', { count: item.units })
    default:
      return t('social.feed.wasActive')
  }
}

/** A friend's name, or the translated placeholder when they never set one. */
export function friendName(profile: Pick<FriendProfile, 'displayName'>, t: TFunction): string {
  return profile.displayName || t('social.anonymous')
}
