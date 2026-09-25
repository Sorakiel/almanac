import { useId, type CSSProperties } from 'react'
import { intlLocale } from '@/lib/dateLocale'
import { useT } from '@/hooks/useT'

const SPARKS = 14
/** Sparks fly out on three rings so the burst doesn't read as a circle. */
const SPARK_RADII = [110, 128, 146]
const SPARK_TONES = ['bg-accent', 'bg-amber', 'bg-teal'] as const

interface DaySealProps {
  /** Read by screen readers: the stamp itself is decorative. */
  label: string
}

/**
 * "День закрыт" — the perfect-day seal. A stamp in the brand accent with the
 * date around its rim, sparks in the module colours and a warm glow. Pure CSS
 * animation (globals.css, `.seal-*`); the host removes it after 2.1 s.
 */
export function DaySeal({ label }: DaySealProps) {
  const { t, locale } = useT()
  const pathId = useId()
  const date = new Intl.DateTimeFormat(intlLocale(locale), { day: 'numeric', month: 'long' })
    .format(new Date())
    .toLocaleUpperCase(intlLocale(locale))

  return (
    <div
      className="pointer-events-none fixed inset-0 z-celebration grid place-items-center"
      role="status"
    >
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="seal-glow absolute inset-0" />
      <div aria-hidden="true" className="seal-stamp relative h-44 w-44">
        {Array.from({ length: SPARKS }, (_, i) => {
          const a = (i / SPARKS) * Math.PI * 2
          const r = SPARK_RADII[i % SPARK_RADII.length]!
          const style = {
            '--dx': `${Math.round(Math.cos(a) * r)}px`,
            '--dy': `${Math.round(Math.sin(a) * r)}px`,
          } as CSSProperties
          return (
            <i
              key={i}
              style={style}
              className={`seal-spark absolute left-1/2 top-1/2 h-2 w-2 rounded-full ${SPARK_TONES[i % SPARK_TONES.length]}`}
            />
          )
        })}
        <svg viewBox="0 0 176 176" className="h-full w-full overflow-visible">
          <defs>
            <path id={pathId} d="M88,88 m-62,0 a62,62 0 1,1 124,0 a62,62 0 1,1 -124,0" />
          </defs>
          <circle cx="88" cy="88" r="84" className="fill-accent-solid" />
          <circle
            cx="88"
            cy="88"
            r="76"
            fill="none"
            className="stroke-on-accent-solid"
            strokeOpacity={0.5}
            strokeWidth={1.5}
            strokeDasharray="3 4"
          />
          <text className="fill-on-accent-solid font-mono" fontSize={11} letterSpacing={3}>
            <textPath href={`#${pathId}`}>{t('celebrate.sealRim', { date })}</textPath>
          </text>
          <path
            d="M64 90l16 16 32-34"
            fill="none"
            className="stroke-on-accent-solid"
            strokeWidth={8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  )
}
