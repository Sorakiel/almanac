import type { Verdict } from '@/features/progress/lib/verdict'
import { cn } from '@/lib/utils'

export interface VerdictStat {
  value: string
  label: string
  /** Shown on desktop only — the phone's line under the title already says it. */
  desktopOnly?: boolean
}

interface VerdictCardProps {
  verdict: Verdict
  stats: VerdictStat[]
}

/** The conclusion first: one sentence, one line of why, three numbers. */
export function VerdictCard({ verdict, stats }: VerdictCardProps) {
  return (
    <section className="grid gap-3 rounded-card bg-surface p-4">
      <h2 className="text-headline font-semibold">{verdict.title}</h2>
      {verdict.line ? <p className="text-callout text-muted">{verdict.line}</p> : null}
      {stats.length > 0 ? (
        <dl className="grid grid-cols-3 gap-2 lg:auto-cols-fr lg:grid-flow-col lg:grid-cols-none">
          {stats.map((s) => (
            <div key={s.label} className={cn('min-w-0', s.desktopOnly && 'hidden lg:block')}>
              <dd className="num whitespace-nowrap text-headline font-medium">{s.value}</dd>
              <dt className="text-footnote text-muted">{s.label}</dt>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  )
}
