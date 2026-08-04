import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  BarChart3,
  BookOpen,
  Dumbbell,
  ListChecks,
  NotebookPen,
  Timer,
  Users,
  type LucideIcon,
} from 'lucide-react'

/** Modules the user can show/hide in the nav (Today + More are fixed). */
export type ModuleKey =
  'habits' | 'workouts' | 'insights' | 'flow' | 'reflect' | 'reading' | 'social'

/** Nav metadata, in display order. The nav renders enabled entries. */
export interface NavModule {
  key: ModuleKey
  /**
   * English label, kept so a non-React caller can still name a module. The nav
   * and the hub render `t(\`modules.\${key}.label\`)` instead — the dictionary is
   * the display source, this is the fallback identity.
   */
  label: string
  /** Lucide icon — the single source of truth shared by the nav and modules hub. */
  icon: LucideIcon
  to: string
  /** One-line blurb shown under the label on the Modules hub card. */
  description: string
  /**
   * Core modules are permanent primary-nav items: always shown alongside Today,
   * never toggleable. Optional modules live in the "Modules" section and are
   * added/removed from the nav via the hub switches.
   */
  core?: boolean
}

export const NAV_MODULES: NavModule[] = [
  {
    key: 'habits',
    label: 'Habits',
    icon: ListChecks,
    to: '/habits',
    description: 'Daily tracking, streaks, and schedules.',
    core: true,
  },
  {
    key: 'insights',
    label: 'Insights',
    icon: BarChart3,
    to: '/insights',
    description: 'Trends and completion across every habit.',
    core: true,
  },
  {
    key: 'workouts',
    label: 'Train',
    icon: Dumbbell,
    to: '/train',
    description: 'Workout plans, sessions, and volume.',
  },
  {
    key: 'flow',
    label: 'Flow',
    icon: Timer,
    to: '/flow',
    description: 'Deep-work timer for focused sessions.',
  },
  {
    key: 'reflect',
    label: 'Reflect',
    icon: NotebookPen,
    to: '/reflect',
    description: 'Daily journaling with mood and quotes.',
  },
  {
    key: 'reading',
    label: 'Reading',
    icon: BookOpen,
    to: '/reading',
    description: 'Track books, pages, and reading streaks.',
  },
  {
    key: 'social',
    label: 'Friends',
    icon: Users,
    to: '/friends',
    description: "See how friends' streaks are going.",
  },
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
  reading: false,
  social: false,
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
  /** Set a module on/off directly (onboarding picks it up); core stays pinned. */
  setModule: (key: ModuleKey, on: boolean) => void
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
      setModule: (key, on) =>
        set((state) => {
          if (NAV_MODULES.find((m) => m.key === key)?.core) return state
          return { enabled: { ...state.enabled, [key]: on } }
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
