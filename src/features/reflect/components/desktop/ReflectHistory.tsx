import { ChevronRight } from 'lucide-react'
import { reflectionDateShortLabel } from '@/features/reflect/lib/format'
import type { Reflection } from '@/features/reflect/types'
import { useT } from '@/hooks/useT'
import { intlLocale } from '@/lib/dateLocale'
import { cn } from '@/lib/utils'

interface ReflectHistoryProps {
  past: Reflection[]
  /** Consecutive days with an entry, ending today or yesterday. */
  streak: number
  selectedId: string | null
  onSelect: (id: string) => void
}

/**
 * Desktop "Reflect" history under the composer: one row per past entry, which
 * opens it whole in the inspector.
 */
export function ReflectHistory({ past, streak, selectedId, onSelect }: ReflectHistoryProps) {
  const { t, locale } = useT()
  const dateLocale = intlLocale(locale)

  return (
    <section className="mt-8" aria-label={t('reflect.pastLabel')}>
      <h2 className="mx-1.5 mb-2 text-callout font-semibold text-muted">
        {t('reflect.pastLabel')}
      </h2>

      {past.length > 0 ? (
        <ul className="divide-y overflow-hidden rounded-card bg-surface">
          {past.map((reflection) => {
            const selected = reflection.id === selectedId
            return (
              <li key={reflection.id}>
                <button
                  type="button"
                  onClick={() => onSelect(reflection.id)}
                  aria-expanded={selected}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent',
                    selected && 'bg-accent/10 hover:bg-accent/10',
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-footnote text-muted">
                      {reflectionDateShortLabel(reflection.date, dateLocale)}
                    </span>
                    {reflection.body ? (
                      <span className="mt-0.5 line-clamp-2 block text-callout">
                        {reflection.body}
                      </span>
                    ) : null}
                  </span>
                  <ChevronRight
                    className="h-4 w-4 flex-none text-muted-strong"
                    aria-hidden="true"
                  />
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="mx-1.5 text-footnote text-muted">{t('reflect.pastEmptyShort')}</p>
      )}

      {streak > 0 ? (
        <p className="mt-3 text-center text-footnote text-muted">
          {t('reflect.streakLine', { count: streak })}
        </p>
      ) : null}
    </section>
  )
}
