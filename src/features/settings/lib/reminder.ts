/** Format a reminder time (hour 0–23, minute 0–59) as "08:00" / "02:17". */
export function reminderTimeLabel(hour: number, minute = 0): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

/** Quick-pick reminder presets offered alongside manual time entry. */
export const REMINDER_PRESETS: { label: string; hour: number; minute: number }[] = [
  { label: 'Morning', hour: 8, minute: 0 },
  { label: 'Midday', hour: 12, minute: 0 },
  { label: 'Evening', hour: 20, minute: 0 },
  { label: 'Night', hour: 22, minute: 0 },
]
