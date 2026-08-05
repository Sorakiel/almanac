import type { TFunction } from '@/hooks/useT'

/** Format a reminder time (hour 0–23, minute 0–59) as "08:00" / "02:17". */
export function reminderTimeLabel(hour: number, minute = 0): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

interface ReminderPreset {
  key: 'morning' | 'midday' | 'evening' | 'night'
  hour: number
  minute: number
}

/** Quick-pick reminder presets offered alongside manual time entry. */
export const REMINDER_PRESETS: ReminderPreset[] = [
  { key: 'morning', hour: 8, minute: 0 },
  { key: 'midday', hour: 12, minute: 0 },
  { key: 'evening', hour: 20, minute: 0 },
  { key: 'night', hour: 22, minute: 0 },
]

const PRESET_FALLBACK_LABELS: Record<ReminderPreset['key'], string> = {
  morning: 'Morning',
  midday: 'Midday',
  evening: 'Evening',
  night: 'Night',
}

/** Human label for a reminder preset, e.g. "Morning". */
export function reminderPresetLabel(preset: ReminderPreset, t?: TFunction): string {
  return t ? t(`settings.reminderPreset.${preset.key}`) : PRESET_FALLBACK_LABELS[preset.key]
}
