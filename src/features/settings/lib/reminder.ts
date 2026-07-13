/** Format a reminder hour (0–23) as "08:00" for display. */
export function reminderTimeLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`
}
