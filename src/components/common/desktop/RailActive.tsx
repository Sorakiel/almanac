import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ProgressBlocks } from '@/components/common/ProgressBlocks'
import { useFocusStore } from '@/stores/focus'

/**
 * Persistent "active now" slot for the desktop context rail — shown on EVERY
 * screen, above each page's own rail content. Currently surfaces a running
 * Flow session; other timed features (workouts, reading) can add cards here as
 * they land. Renders nothing when nothing is active.
 */
export function RailActive() {
  const { endsAt, durationMin, label } = useFocusStore()
  const running = endsAt !== null && durationMin !== null

  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!running) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [running])

  if (endsAt === null || durationMin === null) return null

  const msLeft = Math.max(endsAt - now, 0)
  const minLeft = Math.ceil(msLeft / 60_000)
  const elapsedMin = durationMin - msLeft / 60_000

  return (
    <div className="mb-5">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-label text-accent">
        ▶ now · active
      </p>
      <Link
        to="/flow"
        className="relative block overflow-hidden rounded-[18px] border border-accent/25 bg-gradient-to-br from-accent/15 to-transparent p-4 transition-colors hover:border-accent/50"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[10px] uppercase tracking-label text-accent">
            ◷ flow · in session
          </span>
          <span className="flex-none font-mono text-[11px] tabular-nums text-muted-strong">
            {minLeft} min left
          </span>
        </div>
        <p className="mt-2 truncate text-[15px] font-semibold">{label ?? 'Focus session'}</p>
        <div className="mt-2.5">
          <ProgressBlocks
            value={Math.round(elapsedMin * 10)}
            total={durationMin * 10}
            blocks={18}
            aria-label={`${minLeft} minutes left`}
          />
        </div>
      </Link>
    </div>
  )
}
