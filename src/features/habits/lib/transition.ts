import type { CSSProperties } from 'react'

/**
 * The habit's name is one shared element across the row that was tapped and
 * the detail header, so the header grows out of the row during the view
 * transition. Only one element per page may carry a given name.
 */
export function habitNameTransition(habitId: string): CSSProperties {
  return { viewTransitionName: `habit-${habitId}` }
}
