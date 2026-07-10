import { cn } from '@/lib/utils'

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = {
  sm: 'h-10 w-10 text-xs rounded-xl',
  md: 'h-11 w-11 text-sm rounded-xl',
  lg: 'h-14 w-14 text-lg rounded-2xl',
} as const

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

/**
 * Initials avatar tile: translucent accent-tinted gradient over the surface
 * with a thin accent border — the spec board's profile-button treatment.
 */
export function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <span
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden border border-accent/25 bg-surface font-mono font-semibold uppercase text-accent',
        SIZES[size],
        className,
      )}
      aria-hidden="true"
    >
      <span className="absolute inset-0 bg-gradient-to-br from-accent/25 to-transparent" />
      <span className="relative">{initials(name)}</span>
    </span>
  )
}
