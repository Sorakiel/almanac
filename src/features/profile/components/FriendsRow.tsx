import { useNavigate } from 'react-router-dom'
import { Users } from 'lucide-react'
import { toast } from 'sonner'
import { useT } from '@/hooks/useT'

/**
 * Friends, plus the invite: the system share sheet where there is one, the
 * clipboard everywhere else. The link is the app itself — there are no
 * per-user invite codes; friends find each other by name once inside.
 */
export function FriendsRow() {
  const { t } = useT()
  const navigate = useNavigate()

  const invite = async () => {
    const url = window.location.origin
    const text = t('profile.inviteText')
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: 'Almanac', text, url })
        return
      }
      await navigator.clipboard.writeText(`${text} ${url}`)
      toast.success(t('profile.inviteCopied'))
    } catch (error) {
      // Closing the share sheet is a choice, not a failure.
      if (error instanceof DOMException && error.name === 'AbortError') return
      toast.error(t('profile.inviteFailed'))
    }
  }

  return (
    <div className="flex min-h-12 items-center gap-3 pr-4">
      <button
        type="button"
        onClick={() => navigate('/friends')}
        className="flex min-h-12 min-w-0 flex-1 items-center gap-3 pl-4 text-left text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
      >
        <span
          aria-hidden="true"
          className="grid h-8 w-8 flex-none place-items-center rounded-inner text-white"
          style={{ background: 'var(--tile-violet)' }}
        >
          <Users className="h-4 w-4" strokeWidth={2} />
        </span>
        <span className="truncate">{t('profile.friends')}</span>
      </button>
      <button
        type="button"
        onClick={() => void invite()}
        className="rounded-pill bg-accent/15 px-3 py-1.5 text-callout font-semibold text-accent transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-95"
      >
        {t('profile.invite')}
      </button>
    </div>
  )
}
