import { useId, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'
import type { HabitWithTodayLog } from '@/features/habits/types'
import { TodayHabitRow } from './TodayHabitRow'

interface TodayDoneDisclosureProps {
  habits: HabitWithTodayLog[]
  onToggle: (habit: HabitWithTodayLog) => void
  onSkip: (habit: HabitWithTodayLog) => void
}

/**
 * "Done · N", folded by default: what is finished stops asking for attention,
 * but one tap brings it back to untick a mistake.
 */
export function TodayDoneDisclosure({ habits, onToggle, onSkip }: TodayDoneDisclosureProps) {
  const { t } = useT()
  const [open, setOpen] = useState(false)
  const panelId = useId()

  return (
    <div>
      <button
        type="button"
        className="today-disc"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        {t('dashboard.doneSection')}
        <span>
          <span className="num">{habits.length}</span>
          <ChevronRight aria-hidden="true" strokeWidth={2.4} />
        </span>
      </button>
      <div id={panelId} className={cn('today-donebox', open && 'is-open')}>
        <div>
          <div className="today-group mt-2">
            {habits.map((habit) => (
              <TodayHabitRow key={habit.id} habit={habit} onToggle={onToggle} onSkip={onSkip} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
