import { BarChart3 } from 'lucide-react'
import { ComingSoon } from '@/components/common/ComingSoon'

function InsightsPage() {
  return (
    <ComingSoon
      eyebrow="progress"
      title="Insights"
      icon={BarChart3}
      description="Completion trends, streak history, and where your week is strong or slipping."
      phase="Phase 3"
    />
  )
}

export default InsightsPage
