import { Link } from 'react-router-dom'
import { NewBadgeDot } from '@/components/common/NewBadgeDot'
import { useT } from '@/hooks/useT'
import { useToday } from '@/hooks/useToday'

interface TodayHeaderProps {
  /** The profile's name, or the email when there is none — only its first letter shows. */
  name: string
}

/**
 * Date over a large "Today", and the avatar that opens the profile. The avatar
 * is phone-only: on desktop the profile sits at the foot of the sidebar.
 */
export function TodayHeader({ name }: TodayHeaderProps) {
  const { t } = useT()
  const { longDate } = useToday()
  const date = longDate.charAt(0).toUpperCase() + longDate.slice(1)
  const initial = (name.trim().charAt(0) || '·').toUpperCase()

  return (
    <header className="mx-0.5 mb-4 mt-2 flex items-end justify-between lg:mb-5 lg:mt-1">
      <div>
        <p className="text-callout font-medium text-muted">{date}</p>
        <h1 className="text-large-title font-bold">{t('dashboard.title')}</h1>
      </div>
      <Link
        to="/profile"
        aria-label={t('nav.profileAndSettings')}
        className="relative rounded-full lg:hidden"
      >
        <NewBadgeDot corner />
        <span className="today-ava" aria-hidden="true">
          {initial}
        </span>
      </Link>
    </header>
  )
}
