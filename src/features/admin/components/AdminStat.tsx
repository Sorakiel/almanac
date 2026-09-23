import { cn } from '@/lib/utils'

interface AdminStatProps {
  label: string
  value: string
  accent?: boolean
  /** The desktop workspace's roomier tile. */
  size?: 'md' | 'lg'
}

/** One headline number on the admin console. */
export function AdminStat({ label, value, accent = false, size = 'md' }: AdminStatProps) {
  return (
    <div
      className={cn(
        'flex-1 rounded-2xl border bg-panel',
        size === 'lg' ? 'px-5 py-[18px]' : 'px-4 py-3.5',
      )}
    >
      <p className="font-mono text-[9.5px] uppercase tracking-label text-muted-strong">{label}</p>
      <p
        className={cn(
          'mt-1 font-semibold tabular-nums',
          size === 'lg' ? 'text-[27px] tracking-title' : 'text-2xl',
          accent && 'text-accent',
        )}
      >
        {value}
      </p>
    </div>
  )
}
