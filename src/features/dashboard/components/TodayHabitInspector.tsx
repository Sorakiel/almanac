import { useCallback, useEffect } from 'react'
import { Inspector } from '@/components/inspector/Inspector'
import { HabitDetailPanel } from '@/features/habits/components/detail/HabitDetailPanel'
import { useLastValue } from '@/hooks/useSheetKey'
import { useT } from '@/hooks/useT'
import { useUiStore } from '@/stores/ui'

/**
 * The habit panel over Today (desktop-prototype `openInsp`): a row click on a
 * wide screen opens it in place, no page change; the phone goes to the full
 * habit screen instead. The last habit stays rendered while the panel slides out.
 */
export function TodayHabitInspector() {
  const { t } = useT()
  const id = useUiStore((s) => s.inspectedHabit)
  const inspect = useUiStore((s) => s.inspectHabit)
  const shownId = useLastValue(id)
  const close = useCallback(() => inspect(null), [inspect])
  // Leaving Today closes it: coming back should not find a panel left open.
  useEffect(() => close, [close])

  return (
    <Inspector open={id !== null} onClose={close} label={t('habits.inspector')}>
      {shownId ? <HabitDetailPanel key={shownId} id={shownId} onGone={close} /> : null}
    </Inspector>
  )
}
