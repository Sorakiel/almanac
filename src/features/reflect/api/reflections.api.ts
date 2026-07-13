import { supabase } from '@/lib/supabase'
import type { Reflection, ReflectionInsert } from '@/features/reflect/types'

/** A user's reflections, newest calendar day first (own-rows via RLS). */
export async function fetchReflections(userId: string): Promise<Reflection[]> {
  const { data, error } = await supabase
    .from('reflections')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createReflection(input: ReflectionInsert): Promise<Reflection> {
  const { data, error } = await supabase.from('reflections').insert(input).select().single()
  if (error) throw error
  return data
}

export type ReflectionPatch = Partial<
  Pick<Reflection, 'body' | 'mood' | 'energy' | 'day_rating'>
>

export async function updateReflection(id: string, patch: ReflectionPatch): Promise<Reflection> {
  const { data, error } = await supabase
    .from('reflections')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteReflection(id: string): Promise<void> {
  const { error } = await supabase.from('reflections').delete().eq('id', id)
  if (error) throw error
}
