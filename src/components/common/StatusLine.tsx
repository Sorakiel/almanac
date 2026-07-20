import { useIsMutating } from '@tanstack/react-query'

import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { APP_VERSION } from '@/lib/version'
import { cn } from '@/lib/utils'

interface StatusLineProps {
  /** Active (non-archived) habit count. */
  habitCount: number
  className?: string
}

const STATUS = {
  offline: { label: 'offline', dot: 'bg-muted-strong' },
  syncing: { label: 'syncing', dot: 'bg-amber animate-pulse' },
  online: { label: 'online', dot: 'bg-teal' },
} as const

/**
 * A thin mono "system status" line — version, counters, a live dot. Reads as a
 * terminal status bar and quietly signals the app is a tool, not a toy. The dot
 * tracks real state: network reachability plus in-flight writes to Supabase,
 * never a hardcoded label.
 */
export function StatusLine({ habitCount, className }: StatusLineProps) {
  const online = useOnlineStatus()
  const mutating = useIsMutating() > 0

  const status = !online ? STATUS.offline : mutating ? STATUS.syncing : STATUS.online

  return (
    <p
      className={cn(
        'flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-label text-muted-strong',
        className,
      )}
    >
      <span className="text-accent" aria-hidden="true">
        ◇
      </span>
      <span>almanac</span>
      <span aria-hidden="true">·</span>
      <span>v{APP_VERSION}</span>
      <span aria-hidden="true">·</span>
      <span className="tabular-nums">
        {habitCount} {habitCount === 1 ? 'habit' : 'habits'}
      </span>
      <span aria-hidden="true">·</span>
      <span className="flex items-center gap-1.5">
        <span aria-hidden="true" className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
        {status.label}
      </span>
    </p>
  )
}
