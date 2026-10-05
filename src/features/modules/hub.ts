import { Trophy, type LucideIcon } from 'lucide-react'
import { MODULE_HUE } from '@/features/modules/lib/moduleHue'
import { NAV_MODULES, type ModuleKey } from '@/stores/modules'

/** A tile on the Modules hub. Insights is «Прогресс» in the nav, so it has none. */
export type HubKey = Exclude<ModuleKey, 'insights'> | 'achievements'

export interface HubTile {
  key: HubKey
  icon: LucideIcon
  to: string
  hue: string
  /** Has an on/off switch in Customize, so the tile can be drawn faded. */
  toggleable: boolean
}

/**
 * The hub in the prototype's order (`MODLIST`): habits, workouts, reading,
 * focus, reflect, friends, achievements.
 */
export const HUB_TILES: HubTile[] = [
  ...NAV_MODULES.filter((m) => m.key !== 'insights').map((m) => ({
    key: m.key as HubKey,
    icon: m.icon,
    to: m.to,
    hue: MODULE_HUE[m.key],
    toggleable: !m.core && !m.hubOnly,
  })),
  {
    key: 'achievements',
    icon: Trophy,
    to: '/achievements',
    hue: 'rgb(var(--color-warning))',
    toggleable: false,
  },
]
