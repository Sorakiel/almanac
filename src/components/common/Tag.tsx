import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TagProps {
  children: ReactNode
  tone?: 'default' | 'accent' | 'teal' | 'amber' | 'muted'
  className?: string
}

const TONES = {
  default: 'text-muted',
  accent: 'border-accent/40 text-accent',
  teal: 'border-teal/40 text-teal',
  amber: 'border-amber/40 text-amber',
  muted: 'text-muted-strong',
} as const

/** Thin-border mono pill tag (categories, statuses) — a signature motif. */
export function Tag({ children, tone = 'default', className }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill border px-2 py-0.5 font-mono text-[10px] uppercase tracking-label',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
