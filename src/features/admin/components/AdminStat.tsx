import { cn } from '@/lib/utils'

interface AdminStatProps {
  label: string
  value: string
  accent?: boolean
}

/** One headline number on the admin console. */
export function AdminStat({ label, value, accent = false }: AdminStatProps) {
  return (
    <div className="min-w-0 rounded-card bg-surface px-4 py-3.5">
      <p className="truncate text-footnote text-muted">{label}</p>
      <p className={cn('num mt-1 text-title font-semibold', accent && 'text-accent')}>{value}</p>
    </div>
  )
}
