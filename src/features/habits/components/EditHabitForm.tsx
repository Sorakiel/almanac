import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { ChipGroup } from '@/features/habits/components/ChipGroup'
import { CustomCadenceRow } from '@/features/habits/components/CustomCadenceRow'
import { HabitChecklistEditor } from '@/features/habits/components/HabitChecklistEditor'
import { HabitExtraFields, type HabitExtras } from '@/features/habits/components/HabitExtraFields'
import { HabitReminderField } from '@/features/habits/components/HabitReminderField'
import { useHabitMutations } from '@/features/habits/hooks/useHabitMutations'
import {
  CADENCES,
  CADENCE_ORDER,
  TIME_ORDER,
  cadenceOf,
  customCadence,
  type Cadence,
  type CadenceValue,
} from '@/features/habits/lib/cadence'
import { normalizeUnit } from '@/features/habits/lib/goal'
import type { HabitColor, HabitIcon } from '@/features/habits/lib/habitVisuals'
import { ensureReminderDelivery } from '@/features/habits/lib/reminderDelivery'
import type { Habit, HabitTimeOfDay } from '@/features/habits/types'
import { useSession } from '@/hooks/useSession'
import { useT } from '@/hooks/useT'
import { toUserError } from '@/lib/userError'

const NAME_MAX = 60
const LABEL = 'mx-1 mb-2 mt-4 text-footnote font-medium text-muted'

interface EditHabitFormProps {
  habit: Habit
  onDone: () => void
}

/**
 * The quick form's layout (prototype `openSheet('habit')`) filled with a
 * habit: name, «Как часто», «Когда», and «Ещё параметры» for amount, colour,
 * icon, note, reminder and checklist. «Своё» keeps the cadences the four
 * chips don't cover. Saving is never awaited. Archiving lives in the habit's
 * detail, next to «Изменить» — not here too.
 */
export function EditHabitForm({ habit, onDone }: EditHabitFormProps) {
  const { t } = useT()
  const { user } = useSession()
  const { update } = useHabitMutations()
  const [name, setName] = useState(habit.name)
  const [cadence, setCadence] = useState<Cadence | 'custom'>(
    cadenceOf(habit.frequency, habit.target_count),
  )
  const [custom, setCustom] = useState<CadenceValue>(customCadence(habit))
  const [time, setTime] = useState<HabitTimeOfDay>(habit.time_of_day ?? 'anytime')
  const [reminder, setReminder] = useState<number | null>(habit.reminder_at)
  const [more, setMore] = useState(false)
  const [extras, setExtras] = useState<HabitExtras>({
    icon: (habit.icon as HabitIcon | null) ?? 'sparkles',
    color: (habit.color as HabitColor | null) ?? 'accent',
    description: habit.description ?? '',
    checklist: [],
    goal: { goal: habit.daily_goal, unit: habit.unit },
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    update.mutate(
      {
        id: habit.id,
        input: {
          name: trimmed,
          description: extras.description.trim() || null,
          icon: extras.icon,
          color: extras.color,
          ...(cadence === 'custom' ? custom : CADENCES[cadence]),
          time_of_day: time,
          daily_goal: extras.goal.goal,
          unit: extras.goal.goal > 1 ? normalizeUnit(extras.goal.unit) : null,
          reminder_at: reminder,
        },
      },
      { onError: (error) => toast.error(toUserError(error, t, 'habits.saveFailed')) },
    )
    // A new or moved reminder needs this device able to show it.
    if (reminder !== null && reminder !== habit.reminder_at && user) {
      void ensureReminderDelivery(user.id, t)
    }
    onDone()
  }

  return (
    <form onSubmit={submit} className="flex flex-col" noValidate>
      <label className="sr-only" htmlFor="edit-habit-name">
        {t('create.nameLabel')}
      </label>
      <input
        id="edit-habit-name"
        maxLength={NAME_MAX}
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder={t('create.namePlaceholder')}
        className="h-12 w-full rounded-control bg-sheet-fill px-3.5 text-body text-foreground placeholder:text-muted-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
      />

      <span className={LABEL}>{t('create.howOften')}</span>
      <ChipGroup
        label={t('create.howOften')}
        value={cadence}
        onChange={setCadence}
        options={[
          ...CADENCE_ORDER.map((value) => ({ value, label: t(`create.cadence.${value}`) })),
          { value: 'custom' as const, label: t('habits.form.custom') },
        ]}
      />
      {cadence === 'custom' ? <CustomCadenceRow value={custom} onChange={setCustom} /> : null}

      <span className={LABEL}>{t('create.when')}</span>
      <ChipGroup
        label={t('create.when')}
        value={time}
        onChange={setTime}
        options={TIME_ORDER.map((value) => ({ value, label: t(`create.time.${value}`) }))}
      />

      {more ? (
        <HabitExtraFields
          value={extras}
          onChange={setExtras}
          checklistSlot={
            <>
              <HabitReminderField value={reminder} onChange={setReminder} labelClassName={LABEL} />
              <div className="mt-4">
                <HabitChecklistEditor habit={habit} />
              </div>
            </>
          }
        />
      ) : (
        <button
          type="button"
          onClick={() => setMore(true)}
          className="mr-auto min-h-11 px-1 text-callout font-medium text-accent"
        >
          {t('create.moreOptions')}
        </button>
      )}

      <button
        type="submit"
        disabled={!name.trim()}
        className="mt-4 h-12 w-full rounded-pill bg-accent-solid text-body font-semibold text-on-accent-solid transition-opacity disabled:opacity-40"
      >
        {t('habits.form.save')}
      </button>
    </form>
  )
}
