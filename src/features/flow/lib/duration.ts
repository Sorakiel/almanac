/** Bounds for a custom block: shorter isn't deep work, longer needs a break. */
export const MIN_FOCUS_MIN = 5
export const MAX_FOCUS_MIN = 180
/** The knob's step, and the arrow keys' on it. */
export const FOCUS_STEP_MIN = 5

/** The chips under the dial; anything else is «Своё» (prototype `MOD.fControls`). */
export const FOCUS_CHIPS_MIN = [15, 25, 45, 60] as const
/** A full turn of the dial's knob, in minutes; it snaps to FOCUS_STEP_MIN. */
export const DIAL_TURN_MIN = 120
/** The daily focus goal the Today ring and the Flow subtitle count towards. */
export const FOCUS_GOAL_MIN = 50

export function isFocusChip(minutes: number): boolean {
  return (FOCUS_CHIPS_MIN as readonly number[]).includes(minutes)
}

/**
 * Minutes for a knob angle (radians, clockwise from 12 o'clock): 5-minute
 * steps round a 120-minute turn; the top of the dial reads as a full turn.
 */
export function minutesAtAngle(angle: number): number {
  const turn = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
  const snapped =
    Math.round(((turn / (2 * Math.PI)) * DIAL_TURN_MIN) / FOCUS_STEP_MIN) * FOCUS_STEP_MIN
  return Math.max(MIN_FOCUS_MIN, Math.min(DIAL_TURN_MIN, snapped || DIAL_TURN_MIN))
}
