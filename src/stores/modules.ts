import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Modules the user can show/hide in the bottom nav (Today + More are fixed). */
export type ModuleKey = 'habits' | 'flow' | 'workouts' | 'reflect'

/** Nav metadata, in display order. The bottom nav renders enabled entries. */
export interface NavModule {
  key: ModuleKey
  label: string
  /** Spec-board glyph — the nav uses type, not icon fonts. */
  glyph: string
  to: string
}

export const NAV_MODULES: NavModule[] = [
  { key: 'habits', label: 'Habits', glyph: '▤', to: '/habits' },
  { key: 'flow', label: 'Flow', glyph: '◷', to: '/flow' },
  { key: 'workouts', label: 'Train', glyph: '◇', to: '/train' },
  { key: 'reflect', label: 'Reflect', glyph: '✎', to: '/reflect' },
]

/** How many modules fit in the nav between Today and More before it crowds. */
export const MAX_NAV_MODULES = 3

const DEFAULTS: Record<ModuleKey, boolean> = {
  habits: true,
  flow: false,
  workouts: true,
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
      toggle: (key) => set((state) => ({ enabled: { ...state.enabled, [key]: !state.enabled[key] } })),
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
