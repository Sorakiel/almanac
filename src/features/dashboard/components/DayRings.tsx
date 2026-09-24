import { CountUp } from '@/components/common/CountUp'
import { useT } from '@/hooks/useT'

export interface RingValue {
  value: number
  total: number
}

interface DayRingsProps {
  habits: RingValue
  /** Null when the module is off — its ring and legend line go with it. */
  training: RingValue | null
  focus: RingValue | null
}

// The prototype's geometry: an 84px square, rings of radius 37 / 26 / 15, 9 wide.
const SIZE = 84
const CENTER = SIZE / 2
const STROKE = 9
const RADII = [37, 26, 15] as const
const COUNT_MS = 450

interface Ring {
  key: string
  label: string
  color: string
  value: RingValue
  unit?: string
}

function Arc({ radius, color, fraction }: { radius: number; color: string; fraction: number }) {
  const circumference = 2 * Math.PI * radius
  const shared = {
    cx: CENTER,
    cy: CENTER,
    r: radius,
    fill: 'none',
    stroke: color,
    strokeWidth: STROKE,
  }
  return (
    <>
      <circle {...shared} strokeOpacity={0.18} />
      <circle
        {...shared}
        className="is-value"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - Math.min(Math.max(fraction, 0), 1))}
        transform={`rotate(-90 ${CENTER} ${CENTER})`}
      />
    </>
  )
}

/**
 * The day at a glance: habits, training and focus as nested rings with the
 * numbers beside them. Arcs spring to their new length and the digits count,
 * so a tap anywhere on the screen shows up here too.
 */
export function DayRings({ habits, training, focus }: DayRingsProps) {
  const { t } = useT()
  const rings: Ring[] = [
    {
      key: 'habits',
      label: t('dashboard.rings.habits'),
      color: 'rgb(var(--color-accent))',
      value: habits,
    },
  ]
  if (training) {
    rings.push({
      key: 'training',
      label: t('dashboard.rings.training'),
      color: 'rgb(var(--color-teal))',
      value: training,
    })
  }
  if (focus) {
    rings.push({
      key: 'focus',
      label: t('dashboard.rings.focus'),
      color: 'rgb(var(--color-warning))',
      value: focus,
      unit: t('dashboard.rings.minutes'),
    })
  }

  return (
    <div className="today-summary">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
        {rings.map((ring, i) => (
          <Arc
            key={ring.key}
            radius={RADII[i]!}
            color={ring.color}
            fraction={ring.value.total > 0 ? ring.value.value / ring.value.total : 0}
          />
        ))}
      </svg>
      <dl className="today-legend">
        {rings.map((ring) => (
          <div key={ring.key}>
            <dt>
              <span>
                <i style={{ background: ring.color }} aria-hidden="true" />
                {ring.label}
              </span>
            </dt>
            <dd>
              <b className="num">
                <CountUp value={ring.value.value} duration={COUNT_MS} />
                <small>
                  {' '}
                  {ring.unit
                    ? t('dashboard.rings.ofUnit', { total: ring.value.total, unit: ring.unit })
                    : t('dashboard.rings.of', { total: ring.value.total })}
                </small>
              </b>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
