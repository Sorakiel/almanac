import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { WorkoutDetailPanel } from '@/features/workouts/components/detail/WorkoutDetailPanel'
import { useT } from '@/hooks/useT'

function WorkoutDetailPage() {
  const { t } = useT()
  const { id = '' } = useParams()
  const navigate = useNavigate()

  return (
    <div className="mx-auto w-full max-w-[820px]">
      <WorkoutDetailPanel
        id={id}
        onGone={() => navigate('/train')}
        leading={
          <button
            type="button"
            onClick={() => navigate('/train')}
            aria-label={t('workouts.backToWorkouts')}
            className="rounded-full p-1 text-muted hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
        }
      />
    </div>
  )
}

export default WorkoutDetailPage
