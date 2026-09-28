import { useState } from 'react'
import { DetentSheet } from '@/components/ui/detent-sheet'
import { EditHabitForm } from '@/features/habits/components/EditHabitForm'
import { useHabits } from '@/features/habits/hooks/useHabits'
import { useLastValue } from '@/hooks/useSheetKey'
import { useT } from '@/hooks/useT'
import type { Detent } from '@/lib/detents'
import { useUiStore } from '@/stores/ui'

/**
 * «Изменить привычку»: the same sheet and fields as «Новая привычка», filled
 * in. New habits are made in the Create sheet; this one only edits. The form
 * is keyed by habit so each opening starts from the saved values, and the
 * last habit stays drawn while the sheet slides away.
 */
export function HabitFormSheet() {
  const { t } = useT()
  const habitForm = useUiStore((s) => s.habitForm)
  const closeHabitForm = useUiStore((s) => s.closeHabitForm)
  const { habits } = useHabits()
  const [detent, setDetent] = useState<Detent>('large')
  const editing = habitForm ? (habits.find((h) => h.id === habitForm) ?? null) : null
  // By id: `useHabits` hands back a fresh object every render, and remembering
  // the object itself would set state on every render.
  const shownId = useLastValue(editing?.id)
  const shown = shownId ? (habits.find((h) => h.id === shownId) ?? null) : null

  return (
    <DetentSheet
      open={editing !== null}
      onOpenChange={(open) => {
        if (open) return
        closeHabitForm()
        setDetent('large')
      }}
      title={t('habits.editHabit')}
      detent={detent}
      onDetentChange={setDetent}
    >
      {shown ? <EditHabitForm key={shown.id} habit={shown} onDone={closeHabitForm} /> : null}
    </DetentSheet>
  )
}
