import { DoorOpen, LockKeyhole, ShieldCheck, Vault } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StrengthLevel } from '../passwordStrength'

interface VaultStageTileProps {
  level: StrengthLevel
}

// One visual per tier. Full literal Tailwind classes so nothing gets purged.
const STAGES = [
  {
    Icon: DoorOpen,
    text: 'text-danger',
    aura: 'bg-danger/25',
    tile: 'border-danger/25 bg-danger/[0.06]',
    ring: 'border-danger/50',
  },
  {
    Icon: LockKeyhole,
    text: 'text-accent',
    aura: 'bg-accent/25',
    tile: 'border-accent/25 bg-accent/[0.06]',
    ring: 'border-accent/50',
  },
  {
    Icon: Vault,
    text: 'text-amber',
    aura: 'bg-amber/25',
    tile: 'border-amber/25 bg-amber/[0.06]',
    ring: 'border-amber/50',
  },
  {
    Icon: ShieldCheck,
    text: 'text-teal',
    aura: 'bg-teal/25',
    tile: 'border-teal/25 bg-teal/[0.06]',
    ring: 'border-teal/50',
  },
] as const

/**
 * The "stage" square. It's static between keystrokes; the icon swap and the
 * expanding ring fire once, only when the tier actually changes — keying both
 * on `level` re-mounts them so the one-shot animation replays on each promotion
 * or demotion. Motion is suppressed under `prefers-reduced-motion`.
 */
export function VaultStageTile({ level }: VaultStageTileProps) {
  const stage = STAGES[level]
  const { Icon } = stage

  return (
    <div
      className={cn(
        'relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-tile border',
        'transition-colors duration-500',
        stage.tile,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute h-9 w-9 rounded-full blur-md transition-colors duration-500',
          stage.aura,
        )}
      />

      {/* Ripple that expands and fades once, marking the transition. */}
      <span
        key={level}
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0 rounded-tile border motion-safe:animate-ripple motion-reduce:hidden',
          stage.ring,
        )}
      />

      <Icon
        key={`icon-${level}`}
        strokeWidth={1.6}
        className={cn(
          'relative h-6 w-6 transition-colors duration-500',
          'motion-safe:duration-500 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-50',
          stage.text,
        )}
      />
    </div>
  )
}
