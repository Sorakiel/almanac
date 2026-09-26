import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { BookDetailPanel } from '@/features/reading/components/BookDetailPanel'
import { useT } from '@/hooks/useT'

function BookDetailPage() {
  const { t } = useT()
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3">
      <Link
        to="/reading"
        className="inline-flex items-center gap-1.5 self-start text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t('reading.library')}
      </Link>
      <BookDetailPanel id={id} onGone={() => navigate('/reading')} />
    </div>
  )
}

export default BookDetailPage
