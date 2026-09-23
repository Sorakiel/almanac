import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const RAIL_LABEL = 'font-mono text-[10px] uppercase tracking-label'

interface RailCardProps {
  label: ReactNode
  children: ReactNode
}

/** A labelled surface card in the desktop context rail. */
export function RailCard({ label, children }: RailCardProps) {
  return (
    <div className="rounded-[18px] border bg-surface p-[18px]">
      <p className={cn(RAIL_LABEL, 'text-muted-strong')}>{label}</p>
      <div className="mt-2 flex flex-col">{children}</div>
    </div>
  )
}

interface RailRowProps {
  label: string
  value: string
}

/** One label · value line inside a RailCard. */
export function RailRow({ label, value }: RailRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 pt-2.5 text-[13.5px] first:pt-0">
      <span className="flex-none text-muted">{label}</span>
      <span className="min-w-0 truncate text-right font-mono tabular-nums">{value}</span>
    </div>
  )
}

interface RailNoteProps {
  label: string
  tone?: 'accent' | 'teal'
  children: ReactNode
}

const NOTE_TONES = {
  accent: { box: 'border-accent/25 from-accent/10', label: 'text-accent' },
  teal: { box: 'border-teal/25 from-teal/10', label: 'text-teal' },
} as const

/** A tinted aside at the foot of a rail — a tip or a caution. */
export function RailNote({ label, tone = 'accent', children }: RailNoteProps) {
  const t = NOTE_TONES[tone]
  return (
    <div className={cn('rounded-[16px] border bg-gradient-to-br to-transparent p-[18px]', t.box)}>
      <p className={cn(RAIL_LABEL, t.label)}>{label}</p>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">{children}</p>
    </div>
  )
}
