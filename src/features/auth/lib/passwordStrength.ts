/**
 * Password strength model — a small, honest entropy estimator.
 *
 * We don't ship zxcvbn (keeps the auth bundle lean), so entropy is estimated
 * from the character pool the password draws on, discounted for repeated
 * characters. Crack time assumes an offline attacker at 1e10 guesses/sec
 * (fast-hash GPU rig) — the rate that makes the four bit-bands below line up
 * with real-world "time to crack" (35 bits ≈ seconds, 71 bits ≈ millennia).
 */

const GUESSES_PER_SECOND = 1e10
/** Below this level (0-indexed), signup is blocked — "bank vault" or better. */
export const MIN_ACCEPTED_LEVEL = 2

export type StrengthLevel = 0 | 1 | 2 | 3

export interface PasswordStrength {
  /** Estimated entropy, whole bits. */
  bits: number
  /** 0 = weakest (red) … 3 = strongest (green). */
  level: StrengthLevel
  /** Dictionary key suffix for the current tier (`auth.strength.<tier>`). */
  tier: (typeof TIERS)[number]
  /** Live, humanised time to crack — changes with every keystroke. */
  /**
   * How long a guess would take, as data rather than a sentence: Russian needs
   * a plural form per unit, so the wording belongs in the dictionary and only
   * the unit + magnitude belong here.
   */
  crackTime: CrackTime
  /** 0–1 fill for the segmented meter, easing to a boundary at each tier. */
  fill: number
}

/** Unit of the crack-time estimate; `never`/`instant`/`forever` are wordings, not counts. */
export type CrackUnit =
  | 'never'
  | 'instant'
  | 'seconds'
  | 'minutes'
  | 'hours'
  | 'days'
  | 'months'
  | 'years'
  | 'millionYears'
  | 'billionYears'
  | 'trillionYears'
  | 'forever'

export interface CrackTime {
  unit: CrackUnit
  /** Magnitude in `unit`; 0 for the wordings that carry no count. */
  value: number
}

/** Ordered weak → strong. Vault-door metaphor with a Skynet-cold-storage finish. */
export const TIERS = ['open', 'deadbolt', 'vault', 'skynet'] as const

// Bit thresholds between tiers (upper-exclusive for the tier below).
const BIT_BREAKS = [35, 53, 71] as const
// Meter fill anchors so the bar lands on a segment edge at each threshold.
const FILL_ANCHORS: readonly [number, number][] = [
  [0, 0],
  [35, 0.25],
  [53, 0.5],
  [71, 0.75],
  [92, 1],
]

function poolSize(password: string): number {
  let pool = 0
  if (/[a-z]/.test(password)) pool += 26
  if (/[A-Z]/.test(password)) pool += 26
  if (/[0-9]/.test(password)) pool += 10
  if (/[^A-Za-z0-9]/.test(password)) pool += 33
  return pool
}

function estimateBits(password: string): number {
  if (!password) return 0
  const pool = poolSize(password)
  if (pool === 0) return 0
  // Discount repeats: repeated characters carry far less than a fresh draw, so
  // an effective length sits between the unique count and the raw length.
  const unique = new Set(password).size
  const effectiveLength = unique + (password.length - unique) * 0.5
  return Math.round(effectiveLength * Math.log2(pool))
}

function levelForBits(bits: number): StrengthLevel {
  if (bits < BIT_BREAKS[0]) return 0
  if (bits < BIT_BREAKS[1]) return 1
  if (bits < BIT_BREAKS[2]) return 2
  return 3
}

function fillForBits(bits: number): number {
  for (let i = 1; i < FILL_ANCHORS.length; i += 1) {
    const [hiBits, hiFill] = FILL_ANCHORS[i]!
    if (bits <= hiBits) {
      const [loBits, loFill] = FILL_ANCHORS[i - 1]!
      const span = hiBits - loBits || 1
      return loFill + ((bits - loBits) / span) * (hiFill - loFill)
    }
  }
  return 1
}

function humaniseCrackTime(bits: number): CrackTime {
  if (bits <= 0) return { unit: 'never', value: 0 }
  // Average guesses to hit the key is half the space.
  const seconds = Math.pow(2, bits - 1) / GUESSES_PER_SECOND
  if (seconds < 1) return { unit: 'instant', value: 0 }

  const MINUTE = 60
  const HOUR = 3600
  const DAY = 86_400
  const MONTH = 2_629_800
  const YEAR = 31_557_600

  if (seconds < MINUTE) return { unit: 'seconds', value: Math.round(seconds) }
  if (seconds < HOUR) return { unit: 'minutes', value: Math.round(seconds / MINUTE) }
  if (seconds < DAY) return { unit: 'hours', value: Math.round(seconds / HOUR) }
  if (seconds < MONTH) return { unit: 'days', value: Math.round(seconds / DAY) }
  if (seconds < YEAR) return { unit: 'months', value: Math.round(seconds / MONTH) }

  const years = seconds / YEAR
  if (years < 1e6) return { unit: 'years', value: Math.round(years) }
  if (years < 1e9) return { unit: 'millionYears', value: Math.round(years / 1e6) }
  if (years < 1e12) return { unit: 'billionYears', value: Math.round(years / 1e9) }
  if (years < 1e15) return { unit: 'trillionYears', value: Math.round(years / 1e12) }
  return { unit: 'forever', value: 0 }
}

export function scorePassword(password: string): PasswordStrength {
  const bits = estimateBits(password)
  const level = levelForBits(bits)
  return {
    bits,
    level,
    tier: TIERS[level],
    crackTime: humaniseCrackTime(bits),
    fill: fillForBits(bits),
  }
}
