import type { LucideIcon } from 'lucide-react'
import { Coffee, Gem } from 'lucide-react'

/**
 * Ways to support Almanac. Adding a method later = one entry here; the sheet
 * renders links and crypto addresses generically. RU + worldwide by design:
 * Boosty covers fiat from Russia, crypto covers everyone (and is withdrawable
 * without a foreign bank). No in-app payments — links out, addresses copy.
 */
export type SupportMethod =
  | {
      kind: 'link'
      id: string
      label: string
      hint: string
      icon: LucideIcon
      /** Public URL. While it equals PLACEHOLDER_URL the method shows as "soon". */
      url: string
    }
  | {
      kind: 'crypto'
      id: string
      label: string
      hint: string
      icon: LucideIcon
      network: string
      /** Public wallet address. Empty string ⇒ the method shows as "soon". */
      address: string
    }

/** Sentinel for a not-yet-filled link — keeps a broken href from shipping. */
export const PLACEHOLDER_URL = 'REPLACE_ME'

export const SUPPORT_METHODS: readonly SupportMethod[] = [
  {
    kind: 'link',
    id: 'boosty',
    label: 'Boosty',
    hint: 'One-off tip or monthly support',
    icon: Coffee,
    url: 'https://boosty.to/sorakield',
  },
  {
    kind: 'crypto',
    id: 'ton',
    label: 'TON',
    hint: 'The Open Network',
    icon: Gem,
    network: 'TON',
    // TODO: paste the TON wallet address (UQ… / EQ…)
    address: '',
  },
] as const

/** A method is "live" once its link/address is filled in — otherwise "soon". */
export function isMethodLive(method: SupportMethod): boolean {
  return method.kind === 'link'
    ? method.url !== PLACEHOLDER_URL && method.url.length > 0
    : method.address.length > 0
}
