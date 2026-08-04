import { ReflectTicker } from '@/features/reflect/components/ReflectTicker'
import { journalStreak, reflectionDateShortLabel } from '@/features/reflect/lib/format'
import type { Reflection } from '@/features/reflect/types'
import { useT } from '@/hooks/useT'
import { intlLocale } from '@/lib/dateLocale'

interface ReflectRailProps {
  reflections: Reflection[]
  past: Reflection[]
  /** The user's local date key, for the current-streak calculation. */
  dateKey: string
}

const BORDER_TONES = ['border-accent', 'border-teal', 'border-amber'] as const

/** Desktop Reflect context rail: the narrator, past entries, and the streak. */
export function ReflectRail({ reflections, past, dateKey }: ReflectRailProps) {
  const { t, locale } = useT()
  const dateLocale = intlLocale(locale)
  const streak = journalStreak(new Set(reflections.map((r) => r.date)), dateKey)

  return (
    <div className="flex flex-col gap-3.5">
      <ReflectTicker reflections={reflections} dateKey={dateKey} />

      <p className="label-mono">// past entries</p>

      {past.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {past.map((reflection, index) => (
            <div
              key={reflection.id}
              className={`rounded-r-[14px] border-l-2 bg-surface py-3.5 pl-4 pr-3.5 ${BORDER_TONES[index % BORDER_TONES.length]}`}
            >
              <p className="font-mono text-[9.5px] tracking-label text-muted-strong">
                {reflectionDateShortLabel(reflection.date, dateLocale)}
              </p>
              {reflection.body ? (
                <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">
                  {reflection.body}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-muted">{t('reflect.pastEmptyShort')}</p>
      )}

      {streak > 0 ? (
        <p className="mt-1 text-center font-mono text-[11px] text-muted-strong">
          ◇ {streak}-day reflection streak
        </p>
      ) : null}
    </div>
  )
}
