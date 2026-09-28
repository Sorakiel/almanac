import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { useT } from '@/hooks/useT'
import { haptic } from '@/lib/platform/haptics'
import { cn } from '@/lib/utils'

const LEVELS = [1, 2, 3, 4, 5] as const
const NAMES = ['drained', 'low', 'okay', 'good', 'charged'] as const
/** The fill walks cell by cell, this far apart (prototype `--d`). */
const STEP_MS = 45

interface EnergyBatteryProps {
  value: number | null
  onChange: (energy: number) => void
}

function clamp(n: number): number {
  return Math.max(1, Math.min(5, n))
}

/**
 * Energy as a five-cell battery (prototype `.m-batt`), red to green: tap a
 * cell or drag across. It blinks when nearly empty and glows with a bolt when
 * full. A slider for assistive tech and the keyboard.
 */
export function EnergyBattery({ value, onChange }: EnergyBatteryProps) {
  const { t } = useT()
  const bodyRef = useRef<HTMLDivElement>(null)
  // While a finger is down the battery paints this; it commits on release.
  const [dragged, setDragged] = useState<number | null>(null)
  const shown = dragged ?? value

  const levelAt = (clientX: number): number => {
    const rect = bodyRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return shown ?? 1
    return clamp(Math.ceil(((clientX - rect.left) / rect.width) * 5))
  }
  const preview = (next: number) => {
    if (next !== shown) haptic('light')
    setDragged(next)
  }

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture?.(e.pointerId)
    preview(levelAt(e.clientX))
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragged !== null) preview(levelAt(e.clientX))
  }
  const onPointerUp = () => {
    if (dragged === null) return
    if (dragged !== value) onChange(dragged)
    setDragged(null)
  }
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const from = value ?? 0
    const next =
      e.key === 'ArrowRight' || e.key === 'ArrowUp'
        ? from + 1
        : e.key === 'ArrowLeft' || e.key === 'ArrowDown'
          ? from - 1
          : e.key === 'Home'
            ? 1
            : e.key === 'End'
              ? 5
              : null
    if (next === null) return
    e.preventDefault()
    if (clamp(next) !== value) onChange(clamp(next))
  }

  const name = shown !== null ? t(`reflect.energyNames.${NAMES[shown - 1] ?? 'okay'}`) : null
  const color = shown !== null ? `rgb(var(--color-energy-${shown}))` : undefined

  return (
    <div className="reflect-energy">
      <span>{t('reflect.ratings.energy')}</span>
      <div
        role="slider"
        tabIndex={0}
        aria-label={t('reflect.ratings.energy')}
        aria-valuemin={1}
        aria-valuemax={5}
        aria-valuenow={shown ?? undefined}
        aria-valuetext={name ?? t('reflect.energyUnset')}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => setDragged(null)}
        onKeyDown={onKeyDown}
        className="reflect-batt"
        style={{ '--bc': color } as CSSProperties}
      >
        <div ref={bodyRef} className="reflect-batt-body">
          {LEVELS.map((level) => (
            <span
              key={level}
              aria-hidden="true"
              className={cn('reflect-batt-cell', shown !== null && level <= shown && 'is-on')}
              style={{ '--d': `${level * STEP_MS}ms` } as CSSProperties}
            />
          ))}
        </div>
        <span aria-hidden="true" className="reflect-batt-nub" />
        {shown === 5 ? (
          <svg className="reflect-batt-bolt" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M13 2L4 14h7l-1 8 9-12h-7z" />
          </svg>
        ) : null}
      </div>
      {name ? (
        <b className="reflect-energy-label" style={{ color }}>
          {name}
        </b>
      ) : null}
    </div>
  )
}
