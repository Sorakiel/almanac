import type { CSSProperties } from 'react'

/**
 * The habit's name is one shared element across the row that was tapped and
 * the detail header, so the header grows out of the row during the view
 * transition (motion spec, HANDOFF §3).
 *
 * Only the tapped row carries the name. Named, every row became a layer of its
 * own that stayed put while the page slid away under it. The row is named on
 * the tap itself (`claimHabitName`), and keeps it on the way back so the
 * header can shrink into it again.
 */
let active: string | null = null

const name = (habitId: string): string => `habit-${habitId}`

/** For a row in a list: named only while it is the one that was opened. */
export function habitNameTransition(habitId: string): CSSProperties {
  return habitId === active ? { viewTransitionName: name(habitId) } : {}
}

/** For the detail header: always the shared element — it is the only one on its page. */
export function habitHeaderTransition(habitId: string): CSSProperties {
  return { viewTransitionName: name(habitId) }
}

/** Marks the name element a row renders, so a tap can find it. */
export const HABIT_NAME_ATTR = 'data-habit-name'

/**
 * Call from the tap that opens a habit, before navigating. The row's name is
 * named on the element directly: the snapshot is taken before React renders
 * again, so waiting for a render would miss it.
 */
export function claimHabitName(habitId: string, from: Element | null): void {
  active = habitId
  const el = from?.matches(`[${HABIT_NAME_ATTR}]`)
    ? from
    : (from?.querySelector(`[${HABIT_NAME_ATTR}]`) ?? null)
  if (el instanceof HTMLElement) el.style.viewTransitionName = name(habitId)
}
