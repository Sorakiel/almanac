/** A sheet's resting heights: large fills the screen, medium shows its top 58 %. */
export type Detent = 'medium' | 'large'

/** How far down the medium detent rests, as a share of the sheet's height. */
export const MEDIUM_OFFSET = 0.42

/** The resting offset (px from the top position) for a detent. */
export function detentOffset(detent: Detent, height: number): number {
  return detent === 'large' ? 0 : height * MEDIUM_OFFSET
}

/**
 * Where a drag released at `y` (started at `startY`) comes to rest — the
 * prototype's thresholds: past 62 % down, or a 110 px fling down, dismisses; a
 * rise above 25 %, or a 50 px fling up, opens fully; otherwise medium.
 */
export function settleDrag(y: number, startY: number, height: number): Detent | 'closed' {
  if (y > height * 0.62 || y - startY > 110) return 'closed'
  if (y < height * 0.25 || startY - y > 50) return 'large'
  return 'medium'
}

/** Follow the finger, but resist being pulled above the top: a quarter of the overshoot. */
export function dragOffset(startY: number, delta: number): number {
  const y = startY + delta
  return y < 0 ? y / 4 : y
}
