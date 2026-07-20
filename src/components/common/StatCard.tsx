import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  /** Mono micro-label above the value. */
  label: string
  value: string | number
  hint?: string
  icon?: LucideIcon
  className?: string
}

/** Compact metric tile: mono label, large value, optional icon + hint. */
export function StatCard({ label, value, hint, icon: Icon, className }: StatCardProps) {
  return (
    <Card className={cn('flex flex-col gap-2 p-4', className)}>
      <div className="flex items-center justify-between">
        <span className="label-mono">{label}</span>
        {Icon ? <Icon className="h-4 w-4 text-muted" aria-hidden="true" /> : null}
      </div>
      <span className="text-3xl font-semibold tabular-nums tracking-title">{value}</span>
      {hint ? <span className="text-sm text-muted">{hint}</span> : null}
    </Card>
  )
}
