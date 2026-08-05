import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface Passkey {
  id: string
  friendly_name?: string
  created_at: string
  last_used_at?: string
}

const PASSKEYS_KEY = ['passkeys'] as const

/** The signed-in user's registered passkeys, plus register/rename/delete. */
export function usePasskeys() {
  const queryClient = useQueryClient()
  const invalidate = () => void queryClient.invalidateQueries({ queryKey: PASSKEYS_KEY })

  const query = useQuery({
    queryKey: PASSKEYS_KEY,
    queryFn: async (): Promise<Passkey[]> => {
      const { data, error } = await supabase.auth.passkey.list()
      if (error) throw error
      return data
    },
  })

  const register = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.auth.registerPasskey()
      if (error) throw error
      return data
    },
    onSuccess: invalidate,
  })

  const rename = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.auth.passkey.update({ passkeyId: id, friendlyName: name })
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.auth.passkey.delete({ passkeyId: id })
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  return {
    passkeys: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    register,
    rename,
    remove,
  }
}
