/** The five avatar gradients, by the key stored in `profiles.avatar_color`. */
export const AVATAR_COLORS = ['ember', 'teal', 'amber', 'violet', 'graphite'] as const

export type AvatarColor = (typeof AVATAR_COLORS)[number]

const DEFAULT_COLOR: AvatarColor = 'ember'

/** Narrow whatever the row holds to a known key; unknown or null is the default. */
export function avatarColorKey(value: string | null | undefined): AvatarColor {
  return AVATAR_COLORS.find((c) => c === value) ?? DEFAULT_COLOR
}

/** The CSS background for a key — the gradients themselves live in tokens.css. */
export function avatarBackground(color: AvatarColor): string {
  return `var(--avatar-${color})`
}

/** One letter on the face, as in the prototype; `?` when there is no name yet. */
export function monogram(name: string): string {
  const first = name.trim()[0]
  return first ? first.toLocaleUpperCase() : '?'
}
