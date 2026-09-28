import { useId } from 'react'

interface WaveRingProps {
  /** Share of the rest still left, 0–1 — the water level. */
  level: number
  /** The countdown as shown, e.g. "01:29". */
  time: string
  label: string
}

// The prototype's wave: a long sine strip, shifted left in a loop.
const WAVE = 'M0 0 Q25 -9 50 0 T100 0 T150 0 T200 0 T250 0 T300 0 T350 0 T400 0 V220 H0 Z'
// Water spans y 8 (full) … 192 (empty) inside the r=90 circle.
const TOP = 8
const DEPTH = 184

/** The rest countdown as teal water that drains with the time left (`MOD.waveRing`). */
export function WaveRing({ level, time, label }: WaveRingProps) {
  const clip = useId()
  const y = TOP + (1 - Math.max(0, Math.min(1, level))) * DEPTH
  return (
    <div
      role="timer"
      aria-label={`${label} ${time}`}
      // 230 on the phone, 260 on the desktop stage.
      className="relative h-57.5 w-57.5 lg:h-65 lg:w-65"
    >
      <svg viewBox="0 0 200 200" aria-hidden="true" className="block h-full w-full">
        <defs>
          <clipPath id={clip}>
            <circle cx="100" cy="100" r="90" />
          </clipPath>
        </defs>
        <circle cx="100" cy="100" r="90" className="fill-teal/10" />
        <g clipPath={`url(#${clip})`}>
          <g className="ws-water" style={{ transform: `translateY(${y}px)` }}>
            <path className="w2" d={WAVE} />
            <path className="w1" d={WAVE} />
          </g>
        </g>
        <circle cx="100" cy="100" r="97" fill="none" strokeWidth="2" className="stroke-teal/35" />
      </svg>
      <div className="absolute inset-0 grid place-content-center justify-items-center">
        <b className="ws-rest-time num text-rest font-medium">{time}</b>
        <small className="mt-1 text-caption font-semibold uppercase tracking-label text-muted">
          {label}
        </small>
      </div>
    </div>
  )
}
