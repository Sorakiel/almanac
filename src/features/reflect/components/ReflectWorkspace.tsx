import { ReflectionComposer } from '@/features/reflect/components/ReflectionComposer'
import { DailyQuote } from '@/features/reflect/components/DailyQuote'
import { MoodMonth } from '@/features/reflect/components/MoodMonth'
import { ReflectHistory } from '@/features/reflect/components/ReflectHistory'
import type { Reflection } from '@/features/reflect/types'
import { useT } from '@/hooks/useT'

/** Dictionary keys for "in <month>", January first. */
const MONTH_KEYS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
] as const

interface ReflectWorkspaceProps {
  dateKey: string
  today: Reflection | null
  past: Reflection[]
  reflections: Reflection[]
  streak: number
}

/**
 * "Reflect" on every width (`MOD.reflect` / `MOD.desk('reflect')`): the
 * streak and month count over the title, the composer, today's quote, the
 * month's mood and past entries that open in place.
 */
export function ReflectWorkspace({
  dateKey,
  today,
  past,
  reflections,
  streak,
}: ReflectWorkspaceProps) {
  const { t } = useT()
  const month = dateKey.slice(0, 7)
  const monthCount = reflections.filter((r) => r.date.startsWith(month)).length
  const monthName = t(
    `reflect.head.monthsIn.${MONTH_KEYS[Number(dateKey.slice(5, 7)) - 1] ?? 'jan'}`,
  )
  const summary = [
    streak > 0 ? t('reflect.head.streak', { count: streak }) : null,
    t('reflect.head.month', { count: monthCount, month: monthName }),
  ]
    .filter(Boolean)
    .join(' · ')
  return (
    <div className="w-full">
      <header className="mx-0.5 mb-4 mt-2">
        <p className="text-callout font-medium text-muted">{summary}</p>
        <h1 className="text-large-title font-bold tracking-title">{t('reflect.title')}</h1>
      </header>

      {/* One tree for every width. Desktop: the module layout (`.dk-mgrid`) —
          composer and history left, mood month and quote in a sticky 360px
          column right. Phone: both columns dissolve (`contents`) into one flow,
          reordered as the mobile prototype: composer, quote, month, history. */}
      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-module lg:items-start lg:gap-6">
        <div className="contents lg:grid lg:min-w-0 lg:grid-cols-1 lg:content-start lg:gap-3.5">
          <div className="order-1 lg:order-none">
            <ReflectionComposer dateKey={dateKey} today={today} />
          </div>
          <div className="order-4 lg:order-none">
            <ReflectHistory past={past} />
          </div>
        </div>
        <aside
          aria-label={t('reflect.moodMonth')}
          className="contents lg:sticky lg:top-toolbar-clearance lg:grid lg:min-w-0 lg:grid-cols-1 lg:content-start lg:gap-3.5"
        >
          <div className="order-3 lg:order-none">
            <MoodMonth todayKey={dateKey} reflections={reflections} />
          </div>
          <div className="order-2 lg:order-none">
            <DailyQuote />
          </div>
        </aside>
      </div>
    </div>
  )
}
