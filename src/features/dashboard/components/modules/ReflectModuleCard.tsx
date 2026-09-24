import { useState } from 'react'
import { toast } from 'sonner'
import { NotebookPen } from 'lucide-react'
import { useReflectionMutations } from '@/features/reflect/hooks/useReflectionMutations'
import { useReflections } from '@/features/reflect/hooks/useReflections'
import { useT } from '@/hooks/useT'
import { useToday } from '@/hooks/useToday'
import { toUserError } from '@/lib/userError'
import { ModuleCard } from './ModuleCard'

/** Mood is stored 1–5, the same scale as the stars on the Reflect screen. */
const MOODS = [
  { value: 1, key: 'rough' },
  { value: 2, key: 'meh' },
  { value: 3, key: 'okay' },
  { value: 4, key: 'good' },
  { value: 5, key: 'great' },
] as const

/**
 * The evening question on Today: five mood chips, one tap saves the day's mood.
 * It writes into today's reflection, so anything already written there stays.
 */
export function ReflectModuleCard() {
  const { t } = useT()
  const { dateKey } = useToday()
  const { reflections } = useReflections()
  const { save } = useReflectionMutations()
  const today = reflections.find((r) => r.date === dateKey) ?? null
  // The write has no optimistic patch of its own, so the chip lights from the
  // tap and the saved row takes over once it lands.
  const [picked, setPicked] = useState<number | null>(null)
  const mood = picked ?? today?.mood ?? null

  const pick = (value: number) => {
    setPicked(value)
    save.mutate(
      {
        id: today?.id ?? null,
        date: dateKey,
        body: today?.body ?? '',
        quoteId: today?.quote_id ?? null,
        mood: value,
        energy: today?.energy ?? null,
        dayRating: today?.day_rating ?? null,
      },
      {
        onError: (error) => {
          setPicked(null)
          toast.error(toUserError(error, t, 'reflect.saveFailed'))
        },
      },
    )
  }

  return (
    <ModuleCard
      icon={NotebookPen}
      hue="teal"
      kicker={t('dashboard.modules.evening')}
      value={mood !== null ? t('dashboard.modules.dayLogged') : t('dashboard.modules.howWasDay')}
    >
      <div className="today-mood" role="group" aria-label={t('reflect.ratings.mood')}>
        {MOODS.map(({ value, key }) => (
          <button
            key={value}
            type="button"
            aria-pressed={mood === value}
            onClick={() => pick(value)}
          >
            {t(`dashboard.modules.moods.${key}`)}
          </button>
        ))}
      </div>
    </ModuleCard>
  )
}
