import { useState } from 'react'
import { cn } from '@/lib/utils'

interface StreakOdometerProps {
  value: number
}

/**
 * A number that rolls to its new value like an odometer instead of snapping —
 * the streak ticking up is the reward for the tap. It only rolls on a real
 * change: the first render, and any re-render at the same value, stay still.
 */
export function StreakOdometer({ value }: StreakOdometerProps) {
  const [roll, setRoll] = useState({ from: value, to: value })
  // Adjusting state during render (not in an effect) so the roll starts on the
  // same frame as the new number, with no flash of the old one.
  if (roll.to !== value) setRoll({ from: roll.to, to: value })

  if (roll.from === roll.to) return <span>{value}</span>
  const down = roll.to < roll.from
  return (
    <>
      {/* Keyed by the pair so a second change restarts the roll. */}
      <span
        key={`${roll.from}-${roll.to}`}
        aria-hidden="true"
        className={cn('today-odo', down && 'is-down')}
      >
        <span>
          {down ? roll.to : roll.from}
          <br />
          {down ? roll.from : roll.to}
        </span>
      </span>
      <span className="sr-only">{value}</span>
    </>
  )
}
