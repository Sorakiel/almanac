import type { Locale } from '@/i18n'
import { isPinnable, NAV_MODULES, type ModuleKey, type PinnableModule } from '@/stores/modules'
import type { ThemePreference } from '@/stores/theme'
import type { Json } from '@/types/database.generated'

/** The synced settings as the app understands them — every field optional. */
export interface SyncedSettings {
  modules?: Partial<Record<ModuleKey, boolean>>
  theme?: ThemePreference
  locale?: Locale
  sound?: boolean
  /** The tab bar's pinned module; null is an explicit "none", not "no choice". */
  pinned?: PinnableModule | null
}

/**
 * How "no pinned tab" is stored. A null column means the account never chose,
 * so unpinning on one device has to write something the others can adopt.
 */
const NO_PIN = 'none'

/** The row's columns this client writes. `home_order` arrives with the Customize screen. */
export interface UserSettingsPatch {
  modules?: Json
  theme?: string
  locale?: string
  sound?: boolean
  pinned_tab?: string
}

/** A row as fetched, narrowed to the columns read here. */
export interface UserSettingsRow {
  modules: Json | null
  theme: string | null
  locale: string | null
  sound: boolean | null
  pinned_tab: string | null
  updated_at: string
}

const THEMES: readonly string[] = ['dark', 'coffee', 'system'] satisfies ThemePreference[]
const LOCALES: readonly string[] = ['en', 'ru'] satisfies Locale[]
const MODULE_KEYS = new Set<string>(NAV_MODULES.map((m) => m.key))

/**
 * Read a row defensively: another device may run a newer build that knows a
 * theme or module this one does not. Unknown values are dropped, not applied,
 * so the local default stands instead of a broken state.
 */
export function fromRow(row: UserSettingsRow): SyncedSettings {
  const out: SyncedSettings = {}
  if (row.theme !== null && THEMES.includes(row.theme)) out.theme = row.theme as ThemePreference
  if (row.locale !== null && LOCALES.includes(row.locale)) out.locale = row.locale as Locale
  if (row.sound !== null) out.sound = row.sound
  if (row.pinned_tab === NO_PIN) out.pinned = null
  else if (row.pinned_tab !== null && isPinnable(row.pinned_tab)) out.pinned = row.pinned_tab
  if (row.modules !== null && typeof row.modules === 'object' && !Array.isArray(row.modules)) {
    const modules: Partial<Record<ModuleKey, boolean>> = {}
    for (const [key, on] of Object.entries(row.modules)) {
      if (MODULE_KEYS.has(key) && typeof on === 'boolean') modules[key as ModuleKey] = on
    }
    out.modules = modules
  }
  return out
}

/** The columns to write for `settings`, leaving out what it does not carry. */
export function toPatch(settings: SyncedSettings): UserSettingsPatch {
  const patch: UserSettingsPatch = {}
  if (settings.modules !== undefined) patch.modules = settings.modules
  if (settings.theme !== undefined) patch.theme = settings.theme
  if (settings.locale !== undefined) patch.locale = settings.locale
  if (settings.sound !== undefined) patch.sound = settings.sound
  if (settings.pinned !== undefined) patch.pinned_tab = settings.pinned ?? NO_PIN
  return patch
}

function sameModules(
  a: Partial<Record<ModuleKey, boolean>> | undefined,
  b: Partial<Record<ModuleKey, boolean>> | undefined,
): boolean {
  if (a === b) return true
  if (!a || !b) return false
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<ModuleKey>
  return [...keys].every((k) => a[k] === b[k])
}

/** Only what changed between two snapshots — a write carries nothing else. */
export function changed(prev: SyncedSettings, next: SyncedSettings): SyncedSettings {
  const out: SyncedSettings = {}
  if (!sameModules(prev.modules, next.modules)) out.modules = next.modules
  if (prev.theme !== next.theme) out.theme = next.theme
  if (prev.locale !== next.locale) out.locale = next.locale
  if (prev.sound !== next.sound) out.sound = next.sound
  if (prev.pinned !== next.pinned) out.pinned = next.pinned
  return out
}

export function isEmpty(settings: SyncedSettings): boolean {
  return Object.values(settings).every((v) => v === undefined)
}
