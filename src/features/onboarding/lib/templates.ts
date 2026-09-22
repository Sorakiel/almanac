import type { HabitFormInput } from '@/features/habits/hooks/useHabitMutations'
import type { HabitColor, HabitIcon } from '@/features/habits/lib/habitVisuals'

/**
 * Curated first-run habits — one tap each, created on finish. Keys match
 * `onboarding.suggestions.*`, so a new template needs a dictionary entry.
 */
export type TemplateKey = 'water' | 'read' | 'move' | 'meditate' | 'sunlight' | 'sleep'

export interface HabitTemplate {
  key: TemplateKey
  icon: HabitIcon
  color: HabitColor
  frequency: HabitFormInput['frequency']
  time_of_day: HabitFormInput['time_of_day']
}

/**
 * Starter habits. The name shown (and saved) comes from
 * `onboarding.suggestions.<key>`, so the habit is created in the language the
 * user is reading.
 */
export const HABIT_TEMPLATES: HabitTemplate[] = [
  { key: 'water', icon: 'droplet', color: 'teal', frequency: 'daily', time_of_day: 'anytime' },
  { key: 'read', icon: 'book', color: 'amber', frequency: 'daily', time_of_day: 'evening' },
  { key: 'move', icon: 'dumbbell', color: 'accent', frequency: 'weekdays', time_of_day: 'anytime' },
  { key: 'meditate', icon: 'brain', color: 'teal', frequency: 'daily', time_of_day: 'morning' },
  { key: 'sunlight', icon: 'sun', color: 'amber', frequency: 'daily', time_of_day: 'morning' },
  { key: 'sleep', icon: 'moon', color: 'muted', frequency: 'daily', time_of_day: 'evening' },
]

/** Two templates pre-checked so the common path is a single tap. */
export const DEFAULT_PICKS = ['water', 'read']

export function toInput(template: HabitTemplate, name: string): HabitFormInput {
  return {
    name,
    description: null,
    icon: template.icon,
    color: template.color,
    frequency: template.frequency,
    target_count: 1,
    time_of_day: template.time_of_day,
  }
}
