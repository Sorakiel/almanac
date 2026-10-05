import { CircleDollarSign, Moon, Target, type LucideIcon } from 'lucide-react'

/**
 * Not-yet-built modules. `key` resolves to `modulesPage.soonModules.*` at
 * render — never at module scope, or the label stops following the language.

 */
export const SOON_MODULES = [
  { key: 'finances', icon: CircleDollarSign },
  { key: 'goals', icon: Target },
  { key: 'sleep', icon: Moon },
] as const satisfies readonly { key: string; icon: LucideIcon }[]
