import { supabase } from '@/lib/supabase'
import type { UserSettingsPatch, UserSettingsRow } from '@/features/settings/lib/userSettings'

/** The account's synced settings, or null before this account has ever synced. */
export async function fetchUserSettings(userId: string): Promise<UserSettingsRow | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('modules, theme, locale, sound, pinned_tab, home_order, updated_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

/**
 * Create the row or change only the columns in `patch` — the upsert touches
 * nothing it was not given, so two devices editing different settings never
 * overwrite each other's.
 */
export async function upsertUserSettings(userId: string, patch: UserSettingsPatch): Promise<void> {
  const { error } = await supabase
    .from('user_settings')
    .upsert({ user_id: userId, ...patch }, { onConflict: 'user_id' })
  if (error) throw error
}
