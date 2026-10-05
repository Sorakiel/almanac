import { createLucideIcon } from 'lucide-react'

/**
 * The prototype's dumbbell (`IC.dumb`): level, plates on both ends. Lucide's
 * `Dumbbell` is drawn on a diagonal, which no screen of the prototype uses.
 */
export const Dumbbell = createLucideIcon('dumbbell-level', [
  ['path', { d: 'M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11', key: 'dumbbell-level' }],
])
