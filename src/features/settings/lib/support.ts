import { Coffee, Gem, type LucideIcon } from 'lucide-react'
import type { Database } from '@/types/database.generated'

/**
 * Donation methods for the "Support Almanac" sheet. The rows live in the
 * `support_methods` table so the owner can add/edit/enable them from the admin
 * console (migration 0021) — no redeploy to change a link. Users read enabled
 * rows; the owner reads all. No in-app payments: links open out, addresses copy.
 */

export type SupportKind = 'link' | 'crypto'

export interface SupportMethod {
  id: string
  kind: SupportKind
  label: string
  hint: string | null
  network: string | null
  /** URL for links, wallet address for crypto. Empty ⇒ shown as "soon". */
  value: string
  enabled: boolean
  sortOrder: number
}

type SupportMethodRow = Database['public']['Tables']['support_methods']['Row']

/** Icon per method kind — links wear the coffee cup, crypto the gem. */
export const SUPPORT_KIND_ICON: Record<SupportKind, LucideIcon> = {
  link: Coffee,
  crypto: Gem,
}

/** Narrow a raw DB row to the domain type (kind is a free-text check column). */
export function mapSupportMethod(row: SupportMethodRow): SupportMethod {
  return {
    id: row.id,
    kind: row.kind === 'crypto' ? 'crypto' : 'link',
    label: row.label,
    hint: row.hint,
    network: row.network,
    value: row.value,
    enabled: row.enabled,
    sortOrder: row.sort_order,
  }
}

/** A method is "live" (actionable) once its link/address is filled in. */
export function isMethodLive(method: SupportMethod): boolean {
  return method.value.trim().length > 0
}
