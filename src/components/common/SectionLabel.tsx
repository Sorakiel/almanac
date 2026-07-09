import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionLabelProps {
  children: ReactNode
  /** Optional right-aligned accessory (e.g. a count or action). */
  accessory?: ReactNode
  className?: string
}

/** Mono `// SECTION` micro-label with an optional right accessory. */
export function SectionLabel({ children, accessory, className }: SectionLabelProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <span className="label-mono">// {children}</span>
      {accessory ? <span className="label-mono text-muted-strong">{accessory}</span> : null}
    </div>
  )
}
