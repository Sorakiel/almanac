import { toast } from 'sonner'
import { BookOpen } from 'lucide-react'
import { useBook } from '@/features/reading/hooks/useBook'
import { useReadingProgress } from '@/features/reading/hooks/useReadingProgress'
import { progressPct, quickAmount, unitsReadOn } from '@/features/reading/lib/progress'
import { useT } from '@/hooks/useT'
import { useToday } from '@/hooks/useToday'
import { toUserError } from '@/lib/userError'
import type { Book } from '@/features/reading/types'
import { ModuleCard, ModuleDonePill } from './ModuleCard'

interface ReadingModuleCardProps {
  book: Book
}

/** The book in hand: where it stands, and "+N pages" for what is left of today's goal. */
export function ReadingModuleCard({ book }: ReadingModuleCardProps) {
  const { t } = useT()
  const { dateKey } = useToday()
  const { sessions } = useBook(book.id)
  const logProgress = useReadingProgress()

  const readToday = unitsReadOn(sessions, dateKey)
  const amount = quickAmount(book, readToday)
  const goal = book.daily_goal && book.daily_goal > 0 ? book.daily_goal : null
  const goalMet = goal !== null && readToday >= goal
  const pct = progressPct(book)
  const mode = book.progress_mode

  const log = () =>
    // Not awaited: the bar moves now; offline the write queues.
    logProgress.mutate(
      { book, nextUnit: book.current_unit + amount },
      { onError: (error) => toast.error(toUserError(error, t, 'reading.progressFailed')) },
    )

  return (
    <ModuleCard
      icon={BookOpen}
      hue="amber"
      kicker={t('dashboard.modules.reading')}
      value={book.title}
      action={
        goalMet ? (
          <ModuleDonePill>{t('dashboard.modules.goalMet')}</ModuleDonePill>
        ) : (
          <button type="button" className="today-pill is-ghost" onClick={log}>
            {t(`reading.quickAdd.${mode}`, { count: amount })}
          </button>
        )
      }
    >
      {pct !== null ? (
        <div
          className="today-prog"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={book.title}
        >
          <b style={{ width: `${pct}%` }} />
        </div>
      ) : null}
      <div className="today-mod-foot">
        <span>
          <span className="num">{book.current_unit}</span>
          {book.total_units ? (
            <>
              {' '}
              {t('reading.of')} <span className="num">{book.total_units}</span>
            </>
          ) : null}{' '}
          {t(`reading.unitWord.${mode}`, { count: book.total_units ?? book.current_unit })}
        </span>
        {pct !== null ? <span className="num flex-none">{pct}%</span> : null}
      </div>
    </ModuleCard>
  )
}
