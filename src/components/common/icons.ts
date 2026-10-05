import { createLucideIcon } from 'lucide-react'

/**
 * The prototype's dumbbell (`IC.dumb`): level, plates on both ends. Lucide's
 * `Dumbbell` is drawn on a diagonal, which no screen of the prototype uses.
 */
export const Dumbbell = createLucideIcon('dumbbell-level', [
  ['path', { d: 'M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11', key: 'dumbbell-level' }],
])

/** The prototype's habits mark (`IC.check`): one tick, not lucide's checklist. */
export const HabitCheck = createLucideIcon('habit-check', [
  ['path', { d: 'M5 12.5l4.5 4.5L19 7.5', key: 'habit-check' }],
])

/** The prototype's reflect mark (`IC.pen`): a pencil, not lucide's notebook. */
export const ReflectPen = createLucideIcon('reflect-pen', [
  ['path', { d: 'M4 20h4L19 9l-4-4L4 16z', key: 'reflect-pen-body' }],
  ['path', { d: 'M13.5 6.5l4 4', key: 'reflect-pen-band' }],
])
