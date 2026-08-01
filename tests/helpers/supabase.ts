import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../src/types/database.generated'

/** The shared E2E account. Real credentials live in CI secrets, never here. */
export const E2E_EMAIL = process.env.E2E_EMAIL ?? ''
export const E2E_PASSWORD = process.env.E2E_PASSWORD ?? ''

const URL = process.env.VITE_SUPABASE_URL ?? ''
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? ''

/**
 * A signed-in Supabase client for the E2E account, used to arrange and tear
 * down state the UI cannot reach quickly (resetting the onboarding flag,
 * deleting rows a spec created). It holds no admin rights — every write goes
 * through the same RLS the app does, so a spec can only touch its own data.
 */
export async function e2eClient(): Promise<SupabaseClient<Database>> {
  const client = createClient<Database>(URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { error } = await client.auth.signInWithPassword({
    email: E2E_EMAIL,
    password: E2E_PASSWORD,
  })
  if (error) throw new Error(`E2E account sign-in failed: ${error.message}`)
  return client
}

/** The E2E account's user id (after sign-in). */
export async function e2eUserId(client: SupabaseClient<Database>): Promise<string> {
  const { data } = await client.auth.getUser()
  const id = data.user?.id
  if (id === undefined) throw new Error('E2E account has no user id')
  return id
}
