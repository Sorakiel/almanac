import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  /** Optional call-to-action (e.g. a Button). */
  action?: ReactNode
  className?: string
}

/** Shared empty-state placeholder — one of the three required data views. */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-card border border-dashed px-6 py-12 text-center',
        className,
      )}
    >
      {Icon ? (
        <div className="rounded-full bg-surface p-3">
          <Icon className="h-6 w-6 text-accent" aria-hidden="true" />
        </div>
      ) : null}
      <div className="flex flex-col gap-1">
        <p className="text-base font-semibold">{title}</p>
        {description ? <p className="text-sm text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}
