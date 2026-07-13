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

/** Passwordless sign-in: email a one-tap magic link that lands on the app root. */
export async function signInWithMagicLink(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/` },
  })
  if (error) throw error
}

export async function signOut(): Promise<void> {
  // Local scope: drop the stored session without a server round-trip. A global
  // sign-out tries to revoke the token server-side, which hangs or 400s when
  // the refresh token is already expired/invalid — the "logout takes forever
  // and errors" case. Locally clearing the session always works and is instant.
  const { error } = await supabase.auth.signOut({ scope: 'local' })
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
