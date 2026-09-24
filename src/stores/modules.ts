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

/** Nav metadata, in display order. Names live in the dictionary: `modules.<key>.label`. */
export interface NavModule {
  key: ModuleKey
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
  {
    key: 'habits',
    icon: ListChecks,
    to: '/habits',
    core: true,
  },
  {
    key: 'insights',
    icon: BarChart3,
    to: '/progress',
    core: true,
  },
  {
    key: 'workouts',
    icon: Dumbbell,
    to: '/train',
  },
  {
    key: 'flow',
    icon: Timer,
    to: '/flow',
  },
  {
    key: 'reflect',
    icon: NotebookPen,
    to: '/reflect',
  },
  {
    key: 'reading',
    icon: BookOpen,
    to: '/reading',
  },
  {
    key: 'social',
    icon: Users,
    to: '/friends',
  },
]

/** Today + these are the fixed primary nav (left panel / bottom nav). */
export const CORE_MODULES: NavModule[] = NAV_MODULES.filter((m) => m.core)
/** Toggleable modules — surfaced under "Modules" once enabled. */
export const OPTIONAL_MODULES: NavModule[] = NAV_MODULES.filter((m) => !m.core)

/**
 * Modules that can take the tab bar's optional fourth tab. Insights is already
 * there as «Прогресс», so pinning it would show the same screen twice.
 */
export type PinnableModule = Exclude<ModuleKey, 'insights'>
export const PINNABLE_MODULES: NavModule[] = NAV_MODULES.filter((m) => m.key !== 'insights')

export function isPinnable(key: string): key is PinnableModule {
  return PINNABLE_MODULES.some((m) => m.key === key)
}

/** The toggleable modules, in the order the account set in Customize. */
export type OrderedModule = Exclude<ModuleKey, 'habits' | 'insights'>
export const DEFAULT_ORDER: OrderedModule[] = OPTIONAL_MODULES.map((m) => m.key as OrderedModule)

export function isOrderedModule(key: string): key is OrderedModule {
  return (DEFAULT_ORDER as string[]).includes(key)
}

/**
 * A saved order made whole: unknown keys dropped, duplicates removed, and any
 * module the saved list doesn't mention (a newer module, an older save)
 * appended in its default place.
 */
export function normalizeOrder(saved: readonly string[]): OrderedModule[] {
  const known = [...new Set(saved.filter(isOrderedModule))]
  return [...known, ...DEFAULT_ORDER.filter((k) => !known.includes(k))]
}

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
  /** Take the account's module choices, as saved from another device. */
  adoptModules: (saved: Partial<Record<ModuleKey, boolean>>) => void
  /** The one module with its own tab in the phone tab bar, or null for none. */
  pinned: PinnableModule | null
  setPinned: (key: PinnableModule | null) => void
  /** Module order on Today and in "My modules" — every toggleable module, on or off. */
  order: OrderedModule[]
  setOrder: (order: readonly string[]) => void
}

export const useModulesStore = create<ModulesState>()(
  persist(
    (set) => ({
      enabled: DEFAULTS,
      pinned: null,
      setPinned: (key) => set({ pinned: key }),
      order: DEFAULT_ORDER,
      setOrder: (order) => set({ order: normalizeOrder(order) }),
      toggle: (key) =>
        set((state) => {
          // Core modules are permanent; ignore attempts to hide them.
          if (NAV_MODULES.find((m) => m.key === key)?.core) return state
          return { enabled: { ...state.enabled, [key]: !state.enabled[key] } }
        }),
      adoptModules: (saved) =>
        set((state) => ({ enabled: withCoreOn({ ...state.enabled, ...saved }) })),
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
        const pinned = (persisted as Partial<ModulesState> | undefined)?.pinned
        const order = (persisted as Partial<ModulesState> | undefined)?.order
        return {
          ...current,
          enabled: withCoreOn({ ...DEFAULTS, ...saved }),
          pinned: typeof pinned === 'string' && isPinnable(pinned) ? pinned : null,
          order: normalizeOrder(Array.isArray(order) ? order : []),
        }
      },
    },
  ),
)
