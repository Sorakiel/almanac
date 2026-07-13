import type { Database } from '@/types/database.generated'

export type Reflection = Database['public']['Tables']['reflections']['Row']
export type ReflectionInsert = Database['public']['Tables']['reflections']['Insert']
