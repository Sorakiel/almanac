import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Modules the user can show/hide in the nav (Today + More are fixed). */
export type ModuleKey = 'habits' | 'workouts' | 'insights' | 'flow' | 'reflect'

/** Nav metadata, in display order. The nav renders enabled entries. */
export interface NavModule {
  key: ModuleKey
  label: string
  /** Spec-board glyph — the nav uses type, not icon fonts. */
  glyph: string
  to: string
}

export const NAV_MODULES: NavModule[] = [
  { key: 'habits', label: 'Habits', glyph: '▤', to: '/habits' },
  { key: 'workouts', label: 'Train', glyph: '◇', to: '/train' },
  { key: 'insights', label: 'Insights', glyph: '▧', to: '/insights' },
  { key: 'flow', label: 'Flow', glyph: '◷', to: '/flow' },
  { key: 'reflect', label: 'Reflect', glyph: '✎', to: '/reflect' },
]

/** How many modules fit in the mobile bottom nav between Today and More. */
export const MAX_NAV_MODULES = 3

const DEFAULTS: Record<ModuleKey, boolean> = {
  habits: true,
  workouts: true,
  insights: true,
  flow: false,
  reflect: false,
}

interface ModulesState {
  enabled: Record<ModuleKey, boolean>
  toggle: (key: ModuleKey) => void
}

export const useModulesStore = create<ModulesState>()(
  persist(
    (set) => ({
      enabled: DEFAULTS,
      toggle: (key) =>
        set((state) => ({ enabled: { ...state.enabled, [key]: !state.enabled[key] } })),
    }),
    {
      name: 'almanac.modules',
      // Fold new module keys in at their default so upgrades don't hide them.
      merge: (persisted, current) => {
        const saved = (persisted as Partial<ModulesState> | undefined)?.enabled ?? {}
        return { ...current, enabled: { ...DEFAULTS, ...saved } }
      },
    },
  ),
)
