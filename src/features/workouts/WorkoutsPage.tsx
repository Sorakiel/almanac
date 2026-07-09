import { Dumbbell } from 'lucide-react'
import { ComingSoon } from '@/components/common/ComingSoon'

function WorkoutsPage() {
  return (
    <ComingSoon
      eyebrow="train"
      title="Workouts"
      icon={Dumbbell}
      description="Plan your week, run sessions with sets × reps, and build an exercise library."
      phase="Phase 2"
    />
  )
}

export default WorkoutsPage
