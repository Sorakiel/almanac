import { supabase } from '@/lib/supabase'
import { mapSupportMethod, type SupportKind, type SupportMethod } from '@/features/settings/lib/support'

/** Master toggle + the methods a given caller may see (RLS scopes the rows). */
export interface SupportConfig {
  enabled: boolean
  methods: SupportMethod[]
}

/** Fields the owner edits when creating/updating a method. */
export interface SupportMethodInput {
  kind: SupportKind
  label: string
  hint: string | null
  network: string | null
  value: string
  enabled: boolean
}

// --- User-facing read (the Settings row + sheet) --------------------------

/**
 * The support config as a regular user sees it: the master flag plus only the
 * enabled methods, in display order. The `enabled` filter is explicit so the
 * owner (whose RLS also returns disabled rows) still previews the real thing.
 */
export async function fetchSupportConfig(): Promise<SupportConfig> {
  const [settings, methods] = await Promise.all([
    supabase.from('app_settings').select('support_enabled').eq('id', true).maybeSingle(),
    supabase
      .from('support_methods')
      .select('*')
      .eq('enabled', true)
      .order('sort_order', { ascending: true }),
  ])
  if (settings.error) throw settings.error
  if (methods.error) throw methods.error
  return {
    enabled: settings.data?.support_enabled ?? false,
    methods: (methods.data ?? []).map(mapSupportMethod),
  }
}

// --- Owner management (admin console) -------------------------------------

/** Every method including disabled ones (owner-only via RLS), in sort order. */
export async function fetchAllSupportMethods(): Promise<SupportMethod[]> {
  const { data, error } = await supabase
    .from('support_methods')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []).map(mapSupportMethod)
}

/** Flip the app-wide Support visibility flag. Owner-only (RLS). */
export async function setSupportEnabled(enabled: boolean): Promise<void> {
  const { error } = await supabase
    .from('app_settings')
    .update({ support_enabled: enabled, updated_at: new Date().toISOString() })
    .eq('id', true)
  if (error) throw error
}

/** Append a method to the end of the list. Owner-only (RLS). */
export async function createSupportMethod(input: SupportMethodInput): Promise<void> {
  const { data: last } = await supabase
    .from('support_methods')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  const sort_order = (last?.sort_order ?? -1) + 1
  const { error } = await supabase.from('support_methods').insert({ ...input, sort_order })
  if (error) throw error
}

/** Update a method's fields. Owner-only (RLS). */
export async function updateSupportMethod(
  id: string,
  patch: Partial<SupportMethodInput>,
): Promise<void> {
  const { error } = await supabase.from('support_methods').update(patch).eq('id', id)
  if (error) throw error
}

/** Permanently remove a method. Owner-only (RLS). */
export async function deleteSupportMethod(id: string): Promise<void> {
  const { error } = await supabase.from('support_methods').delete().eq('id', id)
  if (error) throw error
}
