import type { ReactElement } from 'react'
import { useCountUp } from '@/hooks/useCountUp'

interface CountUpProps {
  /** Target number; rolls up to it from 0 on mount and on change. */
  value: number
  duration?: number
}

/** Renders a number that counts up. Wrap it in whatever type styling you need. */
export function CountUp({ value, duration }: CountUpProps): ReactElement {
  return <>{useCountUp(value, duration)}</>
}
