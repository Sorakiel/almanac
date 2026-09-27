import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useReflectionMutations } from '@/features/reflect/hooks/useReflectionMutations'
import type { Reflection } from '@/features/reflect/types'
import { useT } from '@/hooks/useT'
import { toUserError } from '@/lib/userError'

/** Typing settles for this long before the text is written. */
const TYPING_DEBOUNCE_MS = 800

export interface Draft {
  body: string
  mood: number | null
  energy: number | null
}

export type SaveState = 'idle' | 'saving' | 'saved'

/**
 * Today's entry, written as it changes — no Save button (§2.8). A tap on mood
 * or energy writes at once; typing waits for a pause; leaving the screen
 * writes whatever is still waiting. The write is keyed by the day, so the
 * first insert and every edit after it land on the one row.
 */
export function useAutosaveReflection(
  dateKey: string,
  today: Reflection | null,
  quoteId: string | null,
): { draft: Draft; update: (patch: Partial<Draft>) => void; state: SaveState } {
  const { t } = useT()
  const { save } = useReflectionMutations()
  const [draft, setDraft] = useState<Draft>({
    body: today?.body ?? '',
    mood: today?.mood ?? null,
    energy: today?.energy ?? null,
  })
  const [typing, setTyping] = useState(false)
  const [saved, setSaved] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const write = (d: Draft): void => {
    if (!d.body.trim() && d.mood === null && d.energy === null && !today) return
    save.mutate(
      {
        id: today?.id ?? null,
        date: dateKey,
        body: d.body.trim(),
        quoteId: today?.quote_id ?? quoteId,
        mood: d.mood,
        energy: d.energy,
        dayRating: today?.day_rating ?? null,
      },
      {
        onSuccess: () => setSaved(true),
        onError: (error) => toast.error(toUserError(error, t, 'reflect.saveFailed')),
      },
    )
  }

  // What the unmount flush writes: the draft and writer of the last render.
  const pending = useRef<{ draft: Draft; write: (d: Draft) => void } | null>(null)
  useEffect(() => {
    if (pending.current) pending.current = { draft, write }
  })

  const update = (patch: Partial<Draft>): void => {
    const next = { ...draft, ...patch }
    setDraft(next)
    setSaved(false)
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    pending.current = null
    if ('body' in patch) {
      setTyping(true)
      pending.current = { draft: next, write }
      timer.current = setTimeout(() => {
        timer.current = null
        pending.current = null
        setTyping(false)
        write(next)
      }, TYPING_DEBOUNCE_MS)
    } else {
      setTyping(false)
      write(next)
    }
  }

  // Leaving with text still waiting on the debounce: write it now.
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
      const last = pending.current
      if (last) last.write(last.draft)
    },
    [],
  )

  const state: SaveState = save.isPending || typing ? 'saving' : saved ? 'saved' : 'idle'
  return { draft, update, state }
}
