import { CircleDollarSign, Moon, Target, type LucideIcon } from 'lucide-react'

/**
 * Not-yet-built modules. `key` resolves to `modulesPage.soonModules.*` at
 * render — never at module scope, or the label stops following the language.
 *
 * Shared with the desktop rail rather than living in the page: the rail used to
 * hardcode its own count, which drifted from the list it was counting.
 */
export const SOON_MODULES: readonly { key: string; icon: LucideIcon }[] = [
  { key: 'finances', icon: CircleDollarSign },
  { key: 'goals', icon: Target },
  { key: 'sleep', icon: Moon },
]
