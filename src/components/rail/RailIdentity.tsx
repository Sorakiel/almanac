import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RailIdentityProps {
  /** An icon, or omit for the decorative ◇ mark. */
  icon?: LucideIcon
  /** Tailwind classes for the tile's bg + text color. */
  tone?: string
  title: string
  subtitle: string
}

/** The tinted tile + title + mono subtitle that heads a desktop context rail. */
export function RailIdentity({
  icon: Icon,
  tone = 'bg-accent/15 text-accent',
  title,
  subtitle,
}: RailIdentityProps) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className={cn(
          'flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl text-[17px]',
          tone,
        )}
      >
        {Icon ? <Icon className="h-[18px] w-[18px]" /> : '◇'}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[15px] font-semibold">{title}</p>
        <p className="font-mono text-[10px] text-muted-strong">{subtitle}</p>
      </div>
    </div>
  )
}
