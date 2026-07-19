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

/** One-line summary of what a friend did, for the feed row. */
export function activitySummary(item: FeedItem): string {
  if (item.kind === 'day_completed') {
    if (item.done !== null && item.total !== null) return `closed the day · ${item.done}/${item.total}`
    return 'closed the day'
  }
  return item.title ? `completed “${item.title}”` : 'completed a habit'
}
