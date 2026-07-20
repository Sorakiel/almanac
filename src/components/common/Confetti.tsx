import { useMemo } from 'react'
import { prefersReducedMotion } from '@/lib/motion'

interface ConfettiProps {
  /** Number of pieces. */
  count?: number
}

const COLORS = ['bg-accent', 'bg-teal', 'bg-amber', 'bg-accent-deep']

/**
 * A one-shot confetti burst from the top-center of its (relative) parent.
 * Pieces fan out along deterministic per-piece CSS vars — no randomness, so it
 * looks the same every time and needs no timers. Renders nothing when the user
 * prefers reduced motion.
 */
export function Confetti({ count = 16 }: ConfettiProps) {
  const pieces = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      // Fan the pieces across a downward arc, alternating left/right reach.
      const angle = (i / (count - 1)) * Math.PI // 0…π across the top
      const spread = 120 + (i % 4) * 26
      const tx = Math.cos(angle) * spread * -1
      const ty = 70 + Math.sin(angle) * 150
      const rot = (i % 2 === 0 ? 1 : -1) * (180 + (i % 5) * 40)
      return {
        color: COLORS[i % COLORS.length]!,
        tx: `${tx.toFixed(0)}px`,
        ty: `${ty.toFixed(0)}px`,
        rot: `${rot}deg`,
        delay: `${(i % 5) * 40}ms`,
        left: `${8 + (i / (count - 1)) * 84}%`,
      }
    })
  }, [count])

  if (prefersReducedMotion()) return null

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-0">
      {pieces.map((p, i) => (
        <span
          key={i}
          className={`absolute top-0 h-2 w-1.5 animate-confetti-burst rounded-[1px] ${p.color}`}
          style={
            {
              left: p.left,
              animationDelay: p.delay,
              '--tx': p.tx,
              '--ty': p.ty,
              '--rot': p.rot,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}
