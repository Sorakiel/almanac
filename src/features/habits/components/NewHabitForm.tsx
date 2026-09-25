import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { ChipGroup } from '@/features/habits/components/ChipGroup'
import { HabitExtraFields, type HabitExtras } from '@/features/habits/components/HabitExtraFields'
import { useHabitMutations } from '@/features/habits/hooks/useHabitMutations'
import { ONCE, normalizeUnit } from '@/features/habits/lib/goal'
import { CADENCES, CADENCE_ORDER, TIME_ORDER, type Cadence } from '@/features/habits/lib/cadence'
import type { HabitTimeOfDay } from '@/features/habits/types'
import { useT } from '@/hooks/useT'
import { toastWithUndo } from '@/lib/undoToast'
import { toUserError } from '@/lib/userError'

const NAME_MAX = 60

interface NewHabitFormProps {
  /** Called on submit, before the write lands — the sheet closes on the tap. */
  onDone: () => void
}

/**
 * The quick habit form: a name and two rows of chips cover nine habits in ten.
 * Icon, colour, description and checklist wait behind "More options".
 */
export function NewHabitForm({ onDone }: NewHabitFormProps) {
  const { t } = useT()
  const { create, archive } = useHabitMutations()
  const [name, setName] = useState('')
  const [cadence, setCadence] = useState<Cadence>('daily')
  const [time, setTime] = useState<HabitTimeOfDay>('morning')
  const [extras, setExtras] = useState<HabitExtras | null>(null)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    const id = crypto.randomUUID()
    // Not awaited (0.2): the habit is in the list at once, offline it queues.
    create.mutate(
      {
        id,
        name: trimmed,
        description: extras?.description.trim() || null,
        icon: extras?.icon ?? 'sparkles',
        color: extras?.color ?? 'accent',
        ...CADENCES[cadence],
        time_of_day: time,
        daily_goal: extras?.goal.goal ?? 1,
        unit: normalizeUnit(extras?.goal.unit ?? null),
        checklist: (extras?.checklist ?? []).map((title) => ({ id: crypto.randomUUID(), title })),
      },
      { onError: (error) => toast.error(toUserError(error, t, 'habits.saveFailed')) },
    )
    toastWithUndo(t('create.habitCreated', { name: trimmed }), t('common.undo'), () =>
      archive.mutate(id),
    )
    onDone()
  }

  return (
    <form onSubmit={submit} className="flex flex-col" noValidate>
      <label className="sr-only" htmlFor="new-habit-name">
        {t('create.nameLabel')}
      </label>
      <input
        id="new-habit-name"
        autoFocus
        maxLength={NAME_MAX}
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder={t('create.namePlaceholder')}
        className="h-12 w-full rounded-control bg-sheet-fill px-3.5 text-body text-foreground placeholder:text-muted-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
      />

      <span className="mx-1 mb-2 mt-4 text-footnote font-medium text-muted">
        {t('create.howOften')}
      </span>
      <ChipGroup
        label={t('create.howOften')}
        value={cadence}
        onChange={setCadence}
        options={CADENCE_ORDER.map((value) => ({ value, label: t(`create.cadence.${value}`) }))}
      />

      <span className="mx-1 mb-2 mt-4 text-footnote font-medium text-muted">
        {t('create.when')}
      </span>
      <ChipGroup
        label={t('create.when')}
        value={time}
        onChange={setTime}
        options={TIME_ORDER.map((value) => ({ value, label: t(`create.time.${value}`) }))}
      />

      {extras ? (
        <HabitExtraFields value={extras} onChange={setExtras} />
      ) : (
        <button
          type="button"
          onClick={() =>
            setExtras({
              icon: 'sparkles',
              color: 'accent',
              description: '',
              checklist: [],
              goal: ONCE,
            })
          }
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
        {t('create.submit')}
      </button>
    </form>
  )
}
