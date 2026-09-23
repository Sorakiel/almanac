/** Preset focus lengths, in minutes. */
export const DURATION_PRESETS_MIN = [15, 25, 45] as const

/** Bounds for a custom block: shorter isn't deep work, longer needs a break. */
export const MIN_FOCUS_MIN = 5
export const MAX_FOCUS_MIN = 180
/** What the − / + buttons move by. */
export const FOCUS_STEP_MIN = 5

/** Clamp to the allowed range and round to whole minutes; NaN falls back. */
export function clampFocusMinutes(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback
  return Math.min(MAX_FOCUS_MIN, Math.max(MIN_FOCUS_MIN, Math.round(value)))
}
