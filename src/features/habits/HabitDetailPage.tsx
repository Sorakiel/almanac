import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { HabitDetailPanel } from '@/features/habits/components/detail/HabitDetailPanel'
import { useT } from '@/hooks/useT'

function HabitDetailPage() {
  const { t } = useT()
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  // Back to wherever the row was tapped (Today or Habits); a deep link has no
  // history in the app, so it lands on the list.
  const back = () => (location.key === 'default' ? navigate('/habits') : navigate(-1))

  return (
    <div className="lg:mx-auto lg:w-full lg:max-w-[560px]">
      <button
        type="button"
        onClick={back}
        className="-ml-1.5 flex items-center gap-0.5 py-2 text-body text-accent"
      >
        <ChevronLeft aria-hidden="true" className="h-[22px] w-[22px]" strokeWidth={2.4} />
        {t('habits.back')}
      </button>

      <HabitDetailPanel id={id} onGone={() => navigate('/habits')} />
    </div>
  )
}

export default HabitDetailPage
