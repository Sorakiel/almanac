import { cn } from '@/lib/utils'

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = {
  sm: 'h-9 w-9 text-xs rounded-tile',
  md: 'h-11 w-11 text-sm rounded-tile',
  lg: 'h-14 w-14 text-lg rounded-2xl',
} as const

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

/** Initials avatar tile in the brand accent. */
export function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center bg-accent font-mono font-semibold uppercase text-on-accent',
        SIZES[size],
        className,
      )}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}
