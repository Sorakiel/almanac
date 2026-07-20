import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IconTileProps {
  icon: LucideIcon
  /** Tailwind classes for bg + text color, e.g. 'bg-teal/15 text-teal'. */
  tone?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = {
  sm: { box: 'h-9 w-9 rounded-tile', icon: 'h-4 w-4' },
  md: { box: 'h-11 w-11 rounded-tile', icon: 'h-5 w-5' },
  lg: { box: 'h-14 w-14 rounded-2xl', icon: 'h-6 w-6' },
} as const

/** Rounded, category-tinted tile holding a single icon — a core mockup motif. */
export function IconTile({
  icon: Icon,
  tone = 'bg-accent/15 text-accent',
  size = 'md',
  className,
}: IconTileProps) {
  const s = SIZES[size]
  return (
    <span className={cn('flex shrink-0 items-center justify-center', s.box, tone, className)}>
      <Icon className={s.icon} aria-hidden="true" />
    </span>
  )
}
