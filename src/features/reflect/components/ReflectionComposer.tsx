import { Check } from 'lucide-react'
import { useDailyQuote } from '@/features/dashboard/hooks/useDailyQuote'
import { useAutosaveReflection } from '@/features/reflect/hooks/useAutosaveReflection'
import { MOODS } from '@/features/reflect/lib/moods'
import type { Reflection } from '@/features/reflect/types'
import { useT } from '@/hooks/useT'
import { dateFromKey } from '@/lib/date'
import { intlLocale } from '@/lib/dateLocale'
import { cn } from '@/lib/utils'

interface ReflectionComposerProps {
  /** The user's local date key — the day this entry belongs to. */
  dateKey: string
  /** Today's existing reflection, or null to compose a fresh one. */
  today: Reflection | null
  /** Leave the quote out — desktop shows it in the side column. */
  hideQuote?: boolean
}

const ENERGY_LEVELS = [1, 2, 3, 4, 5] as const

/**
 * Today's entry, the prototype's reflect editor: "How was the day?", five
 * mood buttons, energy as five dots, the text — and no Save button: it
 * writes itself (see useAutosaveReflection).
 */
export function ReflectionComposer({ dateKey, today, hideQuote = false }: ReflectionComposerProps) {
  const { t, locale } = useT()
  const { quote } = useDailyQuote()
  const { draft, update, state } = useAutosaveReflection(dateKey, today, quote?.id ?? null)
  const dateLabel = new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(dateFromKey(dateKey))

  return (
    <section className="hero-glow hero-glow-accent grid gap-3 rounded-3xl bg-surface p-4.5">
      <p className="text-footnote font-medium text-muted first-letter:uppercase">{dateLabel}</p>
      <h2 className="-mt-1 text-headline font-semibold tracking-title">{t('reflect.prompt')}</h2>

      <div role="group" aria-label={t('reflect.ratings.mood')} className="grid grid-cols-5 gap-1.5">
        {MOODS.map((m) => {
          const on = draft.mood === m.value
          return (
            <button
              key={m.value}
              type="button"
              aria-pressed={on}
              onClick={() => update({ mood: on ? null : m.value })}
              className={cn(
                'grid min-w-0 justify-items-center gap-1.5 rounded-2xl px-0.5 pb-2 pt-2.5 text-caption font-medium transition-transform',
                on ? '-translate-y-0.5 bg-foreground text-bg' : 'bg-sheet-fill text-foreground',
              )}
            >
              <i aria-hidden="true" className={cn('h-6.5 w-6.5 rounded-full', m.dot)} />
              <span className="max-w-full truncate">{t(`dashboard.modules.moods.${m.key}`)}</span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-2.5 text-callout font-medium text-muted">
        {t('reflect.ratings.energy')}
        <div role="group" aria-label={t('reflect.ratings.energy')} className="flex gap-1.5">
          {ENERGY_LEVELS.map((level) => (
            // A 30px dot, as drawn, inside a 44px-tall hit area.
            <button
              key={level}
              type="button"
              aria-label={t('reflect.energyLevel', { value: level })}
              aria-pressed={draft.energy !== null && level <= draft.energy}
              onClick={() => update({ energy: draft.energy === level ? null : level })}
              className="grid h-11 w-7.5 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'h-7.5 w-7.5 rounded-full transition-colors',
                  draft.energy !== null && level <= draft.energy ? 'bg-amber' : 'bg-sheet-fill',
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <textarea
        value={draft.body}
        onChange={(event) => update({ body: event.target.value })}
        placeholder={t('reflect.placeholder')}
        aria-label={t('reflect.today')}
        className="min-h-30 w-full resize-none rounded-2xl bg-sheet-fill px-3.5 py-3 text-body leading-normal placeholder:text-muted-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      />

      <p
        aria-live="polite"
        className={cn(
          'flex min-h-4.5 items-center gap-1.5 text-footnote font-medium',
          state === 'saved' ? 'text-success' : 'text-muted-strong',
        )}
      >
        {state === 'saved' ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}
        {state === 'saving'
          ? t('reflect.autosave.saving')
          : state === 'saved'
            ? t('reflect.autosave.saved')
            : t('reflect.autosave.hint')}
      </p>

      {quote && !hideQuote ? (
        <figure className="border-t pt-3">
          <blockquote className="text-callout italic leading-relaxed text-muted">
            «{quote.text}»
          </blockquote>
          <figcaption className="mt-1 text-footnote font-medium text-muted-strong">
            {quote.author ?? t('reflect.unknownAuthor')}
          </figcaption>
        </figure>
      ) : null}
    </section>
  )
}
