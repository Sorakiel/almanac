import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { useT } from '@/hooks/useT'
import { useToday } from '@/hooks/useToday'
import { trackEvent } from '@/lib/analytics'
import { createFocusSession, deleteFocusSession } from '@/features/flow/api/focusSessions.api'

/** Logs a block; returns a function that takes it back, or null when nothing was logged. */
export type LogFocus = (minutes: number, label: string | null) => (() => void) | null

/**
 * Log a finished Flow block as a focus session for the Deep Work stats.
 * Fire-and-forget: ending a timer must feel instant and never fail, so a
 * dropped write is swallowed (the timer itself is device-local and lossy by
 * design). Sub-minute blocks aren't worth recording. The id is made here so
 * the finish toast can offer Undo without waiting for the insert.
 */
export function useLogFocusSession(): LogFocus {
  const { user } = useSession()
  const { dateKey } = useToday()
  const queryClient = useQueryClient()
  const { t } = useT()

  return useCallback(
    (minutes, label) => {
      if (!user || minutes < 1) return null
      const id = crypto.randomUUID()
      const refresh = () =>
        queryClient.invalidateQueries({ queryKey: ['insights', 'focus', user.id] })
      // The label is user-written and can say anything — only the length goes.
      trackEvent('focus_session_finished', { minutes: Math.round(minutes) })
      const created = createFocusSession({
        id,
        user_id: user.id,
        label: label?.trim() || t('flow.defaultSessionLabel'),
        minutes: Math.round(minutes),
        date: dateKey,
      })
        .then(refresh)
        .catch(() => undefined)
      return () => {
        void created
          .then(() => deleteFocusSession(id))
          .then(refresh)
          .catch(() => undefined)
      }
    },
    [user, dateKey, queryClient, t],
  )
}
