import { avatarBackground, monogram, type AvatarColor } from '@/features/profile/lib/avatarColors'
import { cn } from '@/lib/utils'

/** Drawn in a 104-unit box and scaled by CSS, so one tree serves 104 and 112 px. */
const BOX = 104
const RING_WIDTH = 4
const R = BOX / 2 - RING_WIDTH
const C = 2 * Math.PI * R

interface ProfileAvatarProps {
  name: string
  color: AvatarColor
  /** Share of the ring to draw, 0–1: active days out of days since joining. */
  progress: number
  label: string
  className?: string
}

/** The monogram on its gradient, inside the active-days ring. */
export function ProfileAvatar({ name, color, progress, label, className }: ProfileAvatarProps) {
  const center = BOX / 2
  return (
    <div
      role="img"
      aria-label={label}
      className={cn('relative grid place-items-center', className)}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${BOX} ${BOX}`}
        aria-hidden="true"
      >
        <circle
          cx={center}
          cy={center}
          r={R}
          fill="none"
          className="stroke-accent"
          strokeOpacity={0.16}
          strokeWidth={RING_WIDTH}
        />
        <circle
          cx={center}
          cy={center}
          r={R}
          fill="none"
          className="stroke-accent motion-safe:transition-[stroke-dashoffset] motion-safe:duration-700"
          strokeWidth={RING_WIDTH}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - Math.min(1, Math.max(0, progress)))}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      {/* 84 of 104 — the face sits 10 units inside the ring on each side. */}
      <span
        aria-hidden="true"
        className="grid h-[80.77%] w-[80.77%] place-items-center rounded-full text-[34px] font-semibold text-white shadow-avatar lg:text-[36px]"
        style={{ background: avatarBackground(color) }}
      >
        {monogram(name)}
      </span>
    </div>
  )
}
