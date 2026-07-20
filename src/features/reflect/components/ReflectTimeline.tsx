import { Cascade } from '@/components/common/Cascade'
import { SectionLabel } from '@/components/common/SectionLabel'
import { ReflectionCard } from '@/features/reflect/components/ReflectionCard'
import { ReflectionComposer } from '@/features/reflect/components/ReflectionComposer'
import type { Quote } from '@/features/dashboard/api/quotes.api'
import type { Reflection } from '@/features/reflect/types'

interface ReflectTimelineProps {
  dateKey: string
  today: Reflection | null
  past: Reflection[]
  /** quote_id → Quote, so each past entry can show what it was written against. */
  quoteById: Map<string, Quote>
}

/** Today's composer followed by the reverse-chronological reflection history. */
export function ReflectTimeline({ dateKey, today, past, quoteById }: ReflectTimelineProps) {
  return (
    <div className="flex flex-col gap-5">
      <Cascade>
        <ReflectionComposer dateKey={dateKey} today={today} />

        <div className="flex flex-col gap-3">
          <SectionLabel accessory={past.length > 0 ? `${past.length}` : undefined}>
            PAST
          </SectionLabel>
          {past.length > 0 ? (
            past.map((reflection) => (
              <ReflectionCard
                key={reflection.id}
                reflection={reflection}
                quote={reflection.quote_id ? (quoteById.get(reflection.quote_id) ?? null) : null}
              />
            ))
          ) : (
            <p className="rounded-card border border-dashed px-4 py-6 text-center text-sm text-muted">
              Your past reflections will collect here, one day at a time.
            </p>
          )}
        </div>
      </Cascade>
    </div>
  )
}
