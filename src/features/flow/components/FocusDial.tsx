import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { SandCanvas } from '@/features/flow/components/SandCanvas'
import {
  DIAL_TURN_MIN,
  FOCUS_STEP_MIN,
  MAX_FOCUS_MIN,
  MIN_FOCUS_MIN,
  minutesAtAngle,
} from '@/features/flow/lib/duration'
import { useT } from '@/hooks/useT'
import { haptic } from '@/lib/platform/haptics'
import { cn } from '@/lib/utils'

const R = 104
const CIRC = 2 * Math.PI * R
const TICKS = Array.from({ length: 60 }, (_, i) => i)
/** A press closer to the centre than this (of the radius) is not the ring. */
const RING_MIN = 0.62
/** The knob buzzes on every quarter hour it passes. */
const HAPTIC_EVERY_MIN = 15

function clock(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function polar(angle: number, r: number): [number, number] {
  return [120 + Math.sin(angle) * r, 120 - Math.cos(angle) * r]
}

interface FocusDialProps {
  /** Idle: the chosen length. Running: the block's length. */
  minutes: number
  /** Seconds left; null while idle. */
  secondsLeft: number | null
  paused: boolean
  /** Under the time while running: what the block is for. */
  caption: string
  /** Idle only: the knob or the typed-in time picked a length. */
  onPick: (minutes: number) => void
  /** Idle: the time is a field (tap on it, or «Своё»). Owned by the page so «Своё» can open it. */
  editing: boolean
  onEditingChange: (editing: boolean) => void
}

/**
 * The watch face (prototype `MOD.dial`): 60 ticks, a progress arc, sand
 * inside. Idle, the knob drags round a 120-minute turn in 5-minute steps and
 * a tap on the time turns it into a field (Enter or blur applies, Esc cancels).
 * Running, the arc drains and the time counts down.
 */
export function FocusDial({
  minutes,
  secondsLeft,
  paused,
  caption,
  onPick,
  editing,
  onEditingChange,
}: FocusDialProps) {
  const { t } = useT()
  const ref = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState(false)
  const running = secondsLeft !== null
  const total = minutes * 60
  const frac = running ? secondsLeft / total : Math.min(1, minutes / DIAL_TURN_MIN)
  const knob = polar(frac * 2 * Math.PI, R)

  const read = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - (r.left + r.width / 2)
    const y = e.clientY - (r.top + r.height / 2)
    return { minutes: minutesAtAngle(Math.atan2(x, -y)), reach: Math.hypot(x, y) / (r.width / 2) }
  }
  const pick = (next: number) => {
    if (next === minutes) return
    if (next % HAPTIC_EVERY_MIN === 0) haptic('light')
    onPick(next)
  }
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (running || editing || (e.target as Element).closest('button, input')) return
    const v = read(e)
    if (v.reach < RING_MIN) return
    e.preventDefault()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setDrag(true)
    pick(v.minutes)
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (drag) pick(read(e).minutes)
  }
  const onKnobKey = (e: KeyboardEvent<SVGCircleElement>) => {
    const delta =
      e.key === 'ArrowRight' || e.key === 'ArrowUp'
        ? FOCUS_STEP_MIN
        : e.key === 'ArrowLeft' || e.key === 'ArrowDown'
          ? -FOCUS_STEP_MIN
          : 0
    if (!delta) return
    e.preventDefault()
    pick(Math.max(MIN_FOCUS_MIN, Math.min(DIAL_TURN_MIN, minutes + delta)))
  }

  return (
    <div
      ref={ref}
      className={cn(
        'flow-dial',
        running ? (paused ? 'is-paused' : 'is-run') : 'is-idle',
        drag && 'is-drag',
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={() => setDrag(false)}
      onPointerCancel={() => setDrag(false)}
    >
      <SandCanvas
        progress={running ? 1 - secondsLeft / total : 0}
        active={running}
        flowing={running && !paused}
      />
      <svg viewBox="0 0 240 240" aria-hidden={running ? true : undefined}>
        {TICKS.map((i) => {
          const a = (i / 60) * 2 * Math.PI
          const [x1, y1] = polar(a, 116)
          const [x2, y2] = polar(a, i % 5 ? 112 : 108)
          return (
            <line
              key={i}
              className="flow-dial-tick"
              x1={x1.toFixed(1)}
              y1={y1.toFixed(1)}
              x2={x2.toFixed(1)}
              y2={y2.toFixed(1)}
              strokeWidth={i % 5 ? 1 : 1.8}
            />
          )
        })}
        <circle className="flow-dial-track" cx="120" cy="120" r={R} fill="none" strokeWidth="10" />
        <circle
          className="flow-dial-arc"
          cx="120"
          cy="120"
          r={R}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - frac)}
          transform="rotate(-90 120 120)"
        />
        {running ? null : (
          <circle
            className="flow-dial-knob"
            cx={knob[0].toFixed(1)}
            cy={knob[1].toFixed(1)}
            r="11"
            strokeWidth="4"
            role="slider"
            tabIndex={0}
            aria-label={t('flow.dialKnob')}
            aria-valuemin={MIN_FOCUS_MIN}
            aria-valuemax={DIAL_TURN_MIN}
            aria-valuenow={Math.min(minutes, DIAL_TURN_MIN)}
            aria-valuetext={t('flow.minutesValue', { count: minutes })}
            onKeyDown={onKnobKey}
          />
        )}
      </svg>
      <div className="flow-dial-center">
        {running ? (
          <b className="flow-dial-time" role="timer" aria-live="off">
            {clock(secondsLeft)}
          </b>
        ) : editing ? (
          <DialInput
            minutes={minutes}
            onDone={(next) => {
              onEditingChange(false)
              if (next !== null) onPick(next)
            }}
          />
        ) : (
          <button
            type="button"
            className="flow-dial-time"
            onClick={() => onEditingChange(true)}
            aria-label={t('flow.editMinutes', { count: minutes })}
          >
            {clock(total)}
          </button>
        )}
        <small className="flow-dial-caption">
          {running
            ? `${paused ? `${t('flow.pausedPrefix')} · ` : ''}${caption}`
            : t('flow.tapToType')}
        </small>
      </div>
    </div>
  )
}

/** The time as a field: Enter or leaving applies (1–180), Escape keeps the old value. */
function DialInput({
  minutes,
  onDone,
}: {
  minutes: number
  onDone: (minutes: number | null) => void
}) {
  const { t } = useT()
  const done = useRef(false)
  const finish = (value: number | null) => {
    if (done.current) return
    done.current = true
    onDone(value)
  }
  const commit = (raw: string) => {
    const v = Number.parseInt(raw, 10)
    finish(v >= 1 ? Math.max(1, Math.min(MAX_FOCUS_MIN, v)) : null)
  }
  return (
    <span className="flow-dial-inbox">
      <input
        className="flow-dial-input"
        type="number"
        inputMode="numeric"
        min={1}
        max={MAX_FOCUS_MIN}
        defaultValue={minutes}
        aria-label={t('flow.minutesField')}
        autoFocus
        onFocus={(e) => e.currentTarget.select()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit(e.currentTarget.value)
          if (e.key === 'Escape') finish(null)
        }}
        onBlur={(e) => commit(e.currentTarget.value)}
      />
      <small>{t('flow.minShort')}</small>
    </span>
  )
}
