import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'
import { createFocusSession } from '@/features/flow/api/focusSessions.api'

/**
 * Log a finished Flow block as a focus session for the Deep Work stats.
 * Fire-and-forget: ending a timer must feel instant and never fail, so a
 * dropped write is swallowed (the timer itself is device-local and lossy by
 * design). Sub-minute blocks aren't worth recording.
 */
export function useLogFocusSession(): (minutes: number, label: string | null) => void {
  const { user } = useSession()
  const { dateKey } = useToday()
  const queryClient = useQueryClient()

  return useCallback(
    (minutes, label) => {
      if (!user || minutes < 1) return
      void createFocusSession({
        user_id: user.id,
        label: label?.trim() || 'Focus session',
        minutes: Math.round(minutes),
        date: dateKey,
      })
        .then(() => queryClient.invalidateQueries({ queryKey: ['insights', 'focus', user.id] }))
        .catch(() => undefined)
    },
    [user, dateKey, queryClient],
  )
}
