/**
 * Maps a rating to a red → orange → green tier so its severity reads at a
 * glance, shared by the StarRating input and the RatingBars display twin.
 * Low ratings are danger-red, the midpoint is brand-orange, high ratings are
 * success-green. Tiers are on the value/max ratio so it holds for any scale.
 */
export type RatingTier = 'low' | 'mid' | 'high'

export function ratingTier(value: number, max: number): RatingTier {
  const ratio = value / max
  if (ratio <= 0.4) return 'low'
  if (ratio <= 0.6) return 'mid'
  return 'high'
}

/** Tailwind `bg-*` class for a filled rating bar at the given value. */
export function ratingBarClass(value: number, max: number): string {
  const tier = ratingTier(value, max)
  return tier === 'low' ? 'bg-danger' : tier === 'mid' ? 'bg-accent' : 'bg-success'
}

/** Tailwind `text-*` class matching the bar tint, for the numeric readout. */
export function ratingTextClass(value: number, max: number): string {
  const tier = ratingTier(value, max)
  return tier === 'low' ? 'text-danger' : tier === 'mid' ? 'text-accent' : 'text-success'
}
