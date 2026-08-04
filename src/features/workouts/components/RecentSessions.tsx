import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { recurrenceLabel } from '@/features/workouts/lib/recurrence'
import type { WorkoutView } from '@/features/workouts/types'

interface RecentSessionsProps {
  workouts: WorkoutView[]
}

/** Short "day · time" label from a completed_at instant, UTC-safe enough here. */
function completedLabel(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(iso))
}

/** Compact list of recently completed sessions; each row opens its detail page. */
export function RecentSessions({ workouts }: RecentSessionsProps) {
  const navigate = useNavigate()
  if (workouts.length === 0) {
    return <p className="text-sm text-muted">No completed sessions yet.</p>
  }
  return (
    <ul className="flex flex-col divide-y divide-border/60">
      {workouts.map((w) => (
        <li key={w.id}>
          <button
            type="button"
            onClick={() => navigate(`/train/${w.id}`)}
            className="flex w-full items-center gap-3 py-2.5 text-left"
          >
            <Check className="h-4 w-4 flex-none text-teal" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-medium">{w.name}</p>
              <p className="truncate font-mono text-[10px] uppercase tracking-label text-muted-strong">
                {w.completed_at ? completedLabel(w.completed_at) : (recurrenceLabel(w) ?? '')}
              </p>
            </div>
          </button>
        </li>
      ))}
    </ul>
  )
}
