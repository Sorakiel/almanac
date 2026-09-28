/** Mouth per mood, 1 (rough) → 5 (great) — the prototype's `MOD.face`. */
const MOUTHS = [
  'M13 29.5q7-7 14 0',
  'M14 28.5q6-3.5 12 0',
  'M14.5 27h11',
  'M13 24.5q7 6 14 0',
  'M12 23.5q8 9.5 16 0z',
] as const

interface MoodFaceProps {
  /** Stored mood, 1–5. */
  mood: number
}

/** A drawn face for a mood: tinted disc, eyes (smiling on 5), brows on 1. */
export function MoodFace({ mood }: MoodFaceProps) {
  const great = mood === 5
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="18" style={{ fill: 'var(--fc)' }} />
      <g className="reflect-face-ink">
        {great ? (
          <path d="M11 17q3-3.5 6 0M23 17q3-3.5 6 0" fill="none" />
        ) : (
          <>
            <circle className="reflect-face-dot" cx="14.5" cy="17" r="2.2" />
            <circle className="reflect-face-dot" cx="25.5" cy="17" r="2.2" />
          </>
        )}
        {mood === 1 ? <path d="M11 12.5l5 2M29 12.5l-5 2" fill="none" /> : null}
        <path
          d={MOUTHS[mood - 1] ?? MOUTHS[2]}
          className={great ? 'reflect-face-dot' : undefined}
          fill={great ? undefined : 'none'}
        />
      </g>
    </svg>
  )
}
