import type { FeedItem } from '@/features/social/types'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Day-relative label for a feed row: Today / Yesterday / "8 Jul". */
export function feedDayLabel(eventDate: string, todayKey: string): string {
  if (eventDate === todayKey) return 'Today'
  // Compare as UTC calendar days — both keys are YYYY-MM-DD, so this is safe.
  const diff = Math.round(
    (Date.parse(`${todayKey}T00:00:00Z`) - Date.parse(`${eventDate}T00:00:00Z`)) / 86_400_000,
  )
  if (diff === 1) return 'Yesterday'
  const [, month, day] = eventDate.split('-').map(Number)
  if (!month || !day) return eventDate
  return `${day} ${MONTHS[month - 1]}`
}

/** One-line summary of what a friend did — privacy-safe, never a habit/book name. */
export function activitySummary(item: FeedItem): string {
  switch (item.kind) {
    case 'day_completed':
      return item.done !== null && item.total !== null
        ? `closed the day · ${item.done}/${item.total}`
        : 'closed the day'
    case 'streak_reached':
      return item.days !== null ? `reached a ${item.days}-day streak` : 'hit a streak'
    case 'reading_progress': {
      if (item.units === null) return 'read today'
      const noun =
        item.unit === 'chapters'
          ? item.units === 1
            ? 'chapter'
            : 'chapters'
          : item.units === 1
            ? 'page'
            : 'pages'
      return `read ${item.units} ${noun}`
    }
    default:
      return 'was active'
  }
}
