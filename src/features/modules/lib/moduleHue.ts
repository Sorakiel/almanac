import type { ModuleKey } from '@/stores/modules'

/** Each module's tint, as in the prototypes — the icon square and its glyph. */
export const MODULE_HUE: Record<ModuleKey, string> = {
  habits: 'rgb(var(--color-accent))',
  insights: 'rgb(var(--color-warning))',
  workouts: 'rgb(var(--color-teal))',
  flow: 'rgb(var(--color-accent))',
  reflect: 'rgb(var(--color-teal))',
  reading: 'rgb(var(--color-warning))',
  social: 'rgb(var(--color-warning))',
}
