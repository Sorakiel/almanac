import { supabase } from '@/lib/supabase'

interface Credentials {
  email: string
  password: string
}

interface SignUpArgs extends Credentials {
  displayName: string
}

/** Sign in with email/password. Throws on failure for the caller to surface. */
export async function signInWithPassword({ email, password }: Credentials): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

/** Create an account; display_name is stored in user metadata for the profile trigger. */
export async function signUpWithPassword({
  email,
  password,
  displayName,
}: SignUpArgs): Promise<void> {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  })
  if (error) throw error
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/** Email a password-reset link that lands on /auth/reset. */
export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset`,
  })
  if (error) throw error
}

/** Set a new password for the recovery session created by the reset link. */
export async function updatePassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
}
