/**
 * Generated book covers (the prototype's `.m-cover`): a diagonal gradient per
 * book, picked by a hash of the title so a book keeps its colour everywhere.
 * These are artwork, not interface colour, so they stay the same in both
 * themes — the pairs are the prototype's own covers.
 */
export const COVER_GRADIENTS = [
  ['#E0AA45', '#8A5A12'],
  ['#5A4BA8', '#2F2566'],
  ['#1F8578', '#0F4A43'],
  ['#B8862B', '#6E4A0C'],
  ['#C2562A', '#6E2A10'],
  ['#3E6FB0', '#1C3A66'],
] as const

/** A small, stable string hash (djb2) — the same title, the same cover. */
function hash(text: string): number {
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0
  return Math.abs(h)
}

/** The CSS background for a book's cover. */
export function coverBackground(title: string): string {
  const [from, to] = COVER_GRADIENTS[hash(title) % COVER_GRADIENTS.length] ?? COVER_GRADIENTS[0]
  return `linear-gradient(160deg, ${from}, ${to})`
}
