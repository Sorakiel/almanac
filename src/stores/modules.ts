import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { BarChart3, Dumbbell, ListChecks, NotebookPen, Timer, type LucideIcon } from 'lucide-react'

/** Modules the user can show/hide in the nav (Today + More are fixed). */
export type ModuleKey = 'habits' | 'workouts' | 'insights' | 'flow' | 'reflect'

/** Nav metadata, in display order. The nav renders enabled entries. */
export interface NavModule {
  key: ModuleKey
  label: string
  /** Lucide icon — the single source of truth shared by the nav and modules hub. */
  icon: LucideIcon
  to: string
  /**
   * Core modules are permanent primary-nav items: always shown alongside Today,
   * never toggleable. Optional modules live in the "Modules" section and are
   * added/removed from the nav via the hub switches.
   */
  core?: boolean
}

export const NAV_MODULES: NavModule[] = [
  { key: 'habits', label: 'Habits', icon: ListChecks, to: '/habits', core: true },
  { key: 'insights', label: 'Insights', icon: BarChart3, to: '/insights', core: true },
  { key: 'workouts', label: 'Train', icon: Dumbbell, to: '/train' },
  { key: 'flow', label: 'Flow', icon: Timer, to: '/flow' },
  { key: 'reflect', label: 'Reflect', icon: NotebookPen, to: '/reflect' },
]

/** Today + these are the fixed primary nav (left panel / bottom nav). */
export const CORE_MODULES: NavModule[] = NAV_MODULES.filter((m) => m.core)
/** Toggleable modules — surfaced under "Modules" once enabled. */
export const OPTIONAL_MODULES: NavModule[] = NAV_MODULES.filter((m) => !m.core)

const DEFAULTS: Record<ModuleKey, boolean> = {
  habits: true,
  insights: true,
  workouts: true,
  flow: false,
  reflect: false,
}

/** Force core modules on regardless of what a persisted state carried. */
function withCoreOn(enabled: Record<ModuleKey, boolean>): Record<ModuleKey, boolean> {
  const next = { ...enabled }
  for (const m of CORE_MODULES) next[m.key] = true
  return next
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
        set((state) => {
          // Core modules are permanent; ignore attempts to hide them.
          if (NAV_MODULES.find((m) => m.key === key)?.core) return state
          return { enabled: { ...state.enabled, [key]: !state.enabled[key] } }
        }),
    }),
    {
      name: 'almanac.modules',
      // Fold new module keys in at their default so upgrades don't hide them,
      // and keep core modules pinned on even if an older state disabled them.
      merge: (persisted, current) => {
        const saved = (persisted as Partial<ModulesState> | undefined)?.enabled ?? {}
        return { ...current, enabled: withCoreOn({ ...DEFAULTS, ...saved }) }
      },
    },
  ),
)
