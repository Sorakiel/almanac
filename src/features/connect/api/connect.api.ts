import { z } from 'zod'
import { supabase } from '@/lib/supabase'

// "Sign in with Almanac" from the web app's side: the consent modal and the
// connected-apps list. The server half is migrations/0040_oauth.sql and the
// `oauth` edge function; docs/API.md describes the flow for app authors.

const clientSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon_url: z.string().nullable(),
})

const requestSchema = z.object({
  client: clientSchema,
  scopes: z.array(z.string()),
  email: z.string().nullable(),
  auto: z.boolean(),
})

const connectedAppSchema = z.object({
  client_id: z.string(),
  name: z.string(),
  icon_url: z.string().nullable(),
  scopes: z.array(z.string()),
  connected_at: z.string(),
  last_used_at: z.string().nullable(),
})

export type OAuthRequest = z.infer<typeof requestSchema>
export type ConnectedApp = z.infer<typeof connectedAppSchema>

/** What the app asks for. Throws P0002 for an expired or already answered request. */
export async function fetchOAuthRequest(id: string): Promise<OAuthRequest> {
  const { data, error } = await supabase.rpc('oauth_request_details', { p_request: id })
  if (error) throw error
  return requestSchema.parse(data)
}

/** The user's answer; resolves to where the browser goes next (back to the app). */
export async function decideOAuthRequest(id: string, approve: boolean): Promise<string> {
  const { data, error } = await supabase.rpc('oauth_decide', {
    p_request: id,
    p_approve: approve,
  })
  if (error) throw error
  return z.object({ redirect_url: z.string() }).parse(data).redirect_url
}

export async function fetchConnectedApps(): Promise<ConnectedApp[]> {
  const { data, error } = await supabase.rpc('oauth_connected_apps')
  if (error) throw error
  return z.array(connectedAppSchema).parse(data)
}

/** Revokes the app's refresh tokens and its live access tokens. */
export async function disconnectApp(clientId: string): Promise<void> {
  const { error } = await supabase.rpc('oauth_disconnect', { p_client: clientId })
  if (error) throw error
}
