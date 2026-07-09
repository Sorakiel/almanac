import { NotebookPen } from 'lucide-react'
import { ComingSoon } from '@/components/common/ComingSoon'

function ReflectPage() {
  return (
    <ComingSoon
      eyebrow="reflect"
      title="Journal"
      icon={NotebookPen}
      description="A short daily reflection paired with your quote of the day."
      phase="Phase 3"
    />
  )
}

export default ReflectPage
