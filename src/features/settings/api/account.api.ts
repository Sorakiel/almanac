import { authRedirectTo } from '@/lib/platform/deepLink'
import { supabase } from '@/lib/supabase'

/**
 * Start an email change. Supabase mails a confirmation link to the new address
 * (and, with secure email change on, to the current one too); the address only
 * switches once the link is opened. Returns the pending address it reports.
 */
export async function requestEmailChange(email: string): Promise<string | null> {
  const { data, error } = await supabase.auth.updateUser(
    { email },
    { emailRedirectTo: authRedirectTo('/settings') },
  )
  if (error) throw error
  return data.user.new_email ?? null
}

/** Set a new password for the signed-in account. */
export async function changePassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
}

/**
 * Mirror the display name into the auth user's metadata. The greeting, sidebar
 * and settings header read it from the session, so without this a rename only
 * reaches friends (who read `profiles`) and not the person who made it.
 */
export async function updateAuthDisplayName(displayName: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ data: { display_name: displayName } })
  if (error) throw error
}
