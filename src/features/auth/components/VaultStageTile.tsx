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
    aura: 'bg-danger/30',
    ring: 'border-danger/60',
    tile: 'border-danger/25 bg-danger/[0.06]',
  },
  {
    Icon: LockKeyhole,
    text: 'text-accent',
    aura: 'bg-accent/30',
    ring: 'border-accent/60',
    tile: 'border-accent/25 bg-accent/[0.06]',
  },
  {
    Icon: Vault,
    text: 'text-amber',
    aura: 'bg-amber/30',
    ring: 'border-amber/60',
    tile: 'border-amber/25 bg-amber/[0.06]',
  },
  {
    Icon: ShieldCheck,
    text: 'text-teal',
    aura: 'bg-teal/30',
    ring: 'border-teal/60',
    tile: 'border-teal/25 bg-teal/[0.06]',
  },
] as const

/**
 * The animated "stage" square. Each tier gets a distinct idle motion — a
 * rattling open door (weak) → a fortified, orbiting shield (strong) — plus a
 * soft breathing aura. Motion is suppressed under `prefers-reduced-motion`.
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
      {/* Breathing aura behind the glyph. */}
      <span
        aria-hidden="true"
        className={cn(
          'absolute h-9 w-9 rounded-full blur-md motion-safe:animate-vault-glow motion-reduce:opacity-50',
          stage.aura,
        )}
      />

      {/* Tier-2 (bank vault): a scanning line sweeping the face. */}
      {level === 2 && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-1 top-0 h-px bg-amber/80 motion-safe:animate-vault-scan motion-reduce:hidden"
        />
      )}

      {/* Tier-3 (Skynet vault): an orbiting containment ring. */}
      {level === 3 && (
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute h-11 w-11 rounded-full border border-transparent',
            'motion-safe:animate-vault-orbit motion-reduce:hidden',
            stage.ring,
            'border-t-teal',
          )}
        />
      )}

      <Icon
        key={level}
        strokeWidth={1.6}
        className={cn(
          'relative h-6 w-6 duration-500 animate-in fade-in zoom-in-75',
          stage.text,
          level === 0 && 'motion-safe:animate-vault-shake',
          level === 1 && 'motion-safe:animate-vault-pulse',
        )}
      />
    </div>
  )
}
