import { useEffect } from 'react'
import { toast } from 'sonner'
import { Timer } from 'lucide-react'
import { useLogFocusSession } from '@/features/flow/hooks/useLogFocusSession'
import { useNow } from '@/hooks/useNow'
import { useT } from '@/hooks/useT'
import { useFocusStore } from '@/stores/focus'
import { ModuleCard } from './ModuleCard'

/** The block Today starts — the Flow screen keeps the other lengths. */
export const QUICK_FOCUS_MIN = 25

function clock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * "Start 25:00" from Today, counting down in place once it runs. The timer is
 * the same device-local one Flow uses, so a block started here shows there
 * too; ending it here logs it the same way.
 */
export function FocusModuleCard() {
  const { t } = useT()
  const { endsAt, durationMin, label, start, stop } = useFocusStore()
  const logFocus = useLogFocusSession()
  const running = endsAt !== null && durationMin !== null
  const now = useNow(running)
  const msLeft = running ? endsAt - now : QUICK_FOCUS_MIN * 60_000

  // Ran to the end while Today was open: log the whole block, as Flow does.
  useEffect(() => {
    if (running && endsAt - now <= 0) {
      logFocus(durationMin, label)
      stop()
      toast.success(t('flow.done'))
    }
  }, [running, endsAt, now, durationMin, label, logFocus, stop, t])

  const end = () => {
    if (!running) return
    logFocus(Math.max(0, Math.round(durationMin - msLeft / 60_000)), label)
    stop()
  }

  return (
    <ModuleCard
      icon={Timer}
      hue="accent"
      kicker={
        running
          ? t('dashboard.modules.focusRunning', { label: label ?? t('dashboard.focusSession') })
          : t('dashboard.modules.focus')
      }
      value={<span className="num">{clock(msLeft)}</span>}
      valueClassName="today-mod-v font-medium"
      action={
        running ? (
          <button type="button" className="today-pill is-ghost" onClick={end}>
            {t('dashboard.modules.stop')}
          </button>
        ) : (
          <button type="button" className="today-pill" onClick={() => start(QUICK_FOCUS_MIN)}>
            {t('dashboard.modules.startFocus')}
          </button>
        )
      }
    />
  )
}
