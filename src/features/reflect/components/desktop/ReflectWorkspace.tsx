import { ReflectTimeline } from '@/features/reflect/components/ReflectTimeline'
import type { Quote } from '@/features/dashboard/api/quotes.api'
import type { Reflection } from '@/features/reflect/types'

interface ReflectWorkspaceProps {
  dateKey: string
  today: Reflection | null
  past: Reflection[]
  quoteById: Map<string, Quote>
}

/** Desktop "Reflect" workspace — the daily composer and reflection history. */
export function ReflectWorkspace({ dateKey, today, past, quoteById }: ReflectWorkspaceProps) {
  return (
    <div className="mx-auto max-w-[720px]">
      <header className="mb-7">
        <p className="label-mono">// daily journal</p>
        <h1 className="mt-1.5 text-[44px] leading-none tracking-title">Reflect</h1>
        <p className="mt-2 text-[15px] text-muted">
          A short reflection each day, paired with your quote of the day.
        </p>
      </header>

      <ReflectTimeline dateKey={dateKey} today={today} past={past} quoteById={quoteById} />
    </div>
  )
}
