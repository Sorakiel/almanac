import { ReflectionComposer } from '@/features/reflect/components/ReflectionComposer'
import { DailyQuote } from '@/features/reflect/components/desktop/DailyQuote'
import { MoodMonth } from '@/features/reflect/components/desktop/MoodMonth'
import { ReflectHistory } from '@/features/reflect/components/desktop/ReflectHistory'
import type { Reflection } from '@/features/reflect/types'
import { useT } from '@/hooks/useT'

interface ReflectWorkspaceProps {
  dateKey: string
  today: Reflection | null
  past: Reflection[]
  reflections: Reflection[]
  streak: number
}

/**
 * Desktop "Reflect", the prototype's `MOD.desk('reflect')` in `.dk-mgrid`: the
 * composer and past entries (opened in place) on the left; the month's mood
 * and today's quote in a sticky 360px column on the right.
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
  const summary = [
    streak > 0 ? t('reflect.head.streak', { count: streak }) : null,
    monthCount > 0 ? t('reflect.head.month', { count: monthCount }) : null,
  ]
    .filter(Boolean)
    .join(' · ')
  return (
    <div className="w-full">
      <header className="mx-0.5 mb-4 mt-2">
        <p className="text-callout font-medium text-muted">{summary || t('reflect.subtitle')}</p>
        <h1 className="text-large-title font-bold tracking-title">{t('reflect.title')}</h1>
      </header>

      <div className="grid grid-cols-module items-start gap-6">
        <div className="grid min-w-0 content-start gap-3.5">
          <ReflectionComposer dateKey={dateKey} today={today} hideQuote />
          <ReflectHistory past={past} />
        </div>
        <aside
          aria-label={t('reflect.moodMonth')}
          className="sticky top-toolbar-clearance grid min-w-0 content-start gap-3.5"
        >
          <MoodMonth todayKey={dateKey} reflections={reflections} />
          <DailyQuote />
        </aside>
      </div>
    </div>
  )
}
