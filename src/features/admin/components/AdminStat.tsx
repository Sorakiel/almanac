import { cn } from '@/lib/utils'

interface AdminStatProps {
  label: string
  value: string
  accent?: boolean
}

/** One headline number on the admin console. */
export function AdminStat({ label, value, accent = false }: AdminStatProps) {
  return (
    <div className="flex-1 rounded-2xl border bg-panel px-4 py-3.5">
      <p className="font-mono text-[9.5px] uppercase tracking-label text-muted-strong">{label}</p>
      <p className={cn('mt-1 text-2xl font-semibold tabular-nums', accent && 'text-accent')}>
        {value}
      </p>
    </div>
  )
}
