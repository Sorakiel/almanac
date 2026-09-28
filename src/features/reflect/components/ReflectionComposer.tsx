import { Check } from 'lucide-react'
import { useDailyQuote } from '@/features/dashboard/hooks/useDailyQuote'
import { useAutosaveReflection } from '@/features/reflect/hooks/useAutosaveReflection'
import { EnergyBattery } from '@/features/reflect/components/EnergyBattery'
import { MoodPicker } from '@/features/reflect/components/MoodPicker'
import type { Reflection } from '@/features/reflect/types'
import { useT } from '@/hooks/useT'
import { dateFromKey } from '@/lib/date'
import { intlLocale } from '@/lib/dateLocale'
import { cn } from '@/lib/utils'
import '@/features/reflect/reflect.css'

interface ReflectionComposerProps {
  /** The user's local date key — the day this entry belongs to. */
  dateKey: string
  /** Today's existing reflection, or null to compose a fresh one. */
  today: Reflection | null
}

/**
 * Today's entry, the prototype's reflect editor: "How was the day?", five
 * mood faces, energy as a battery, the text — and no Save button: it
 * writes itself (see useAutosaveReflection).
 */
export function ReflectionComposer({ dateKey, today }: ReflectionComposerProps) {
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

      <MoodPicker value={draft.mood} onChange={(mood) => update({ mood })} />
      <EnergyBattery value={draft.energy} onChange={(energy) => update({ energy })} />

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
    </section>
  )
}
