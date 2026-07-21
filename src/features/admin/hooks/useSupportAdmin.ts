import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createSupportMethod,
  deleteSupportMethod,
  fetchAllSupportMethods,
  fetchSupportConfig,
  setSupportEnabled,
  updateSupportMethod,
  type SupportMethodInput,
} from '@/features/settings/api/support.api'
import type { SupportMethod } from '@/features/settings/lib/support'

interface UseSupportAdminResult {
  methods: SupportMethod[] | undefined
  enabled: boolean | undefined
  isLoading: boolean
  isError: boolean
  refetch: () => void
  setEnabled: (enabled: boolean) => Promise<void>
  create: (input: SupportMethodInput) => Promise<void>
  update: (input: { id: string; patch: Partial<SupportMethodInput> }) => Promise<void>
  remove: (id: string) => Promise<void>
  isMutating: boolean
}

/**
 * Owner-only management of the Support config. Reads every method (incl.
 * disabled) plus the master flag; writes flip the flag, add/edit/remove methods.
 * Every mutation invalidates both the admin view and the user-facing
 * `support-config` cache so the Settings row/sheet reflect changes at once.
 */
export function useSupportAdmin(enabled: boolean): UseSupportAdminResult {
  const queryClient = useQueryClient()
  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'support'] }),
      queryClient.invalidateQueries({ queryKey: ['support-config'] }),
    ])

  const query = useQuery({
    queryKey: ['admin', 'support'],
    queryFn: async () => {
      const [methods, config] = await Promise.all([fetchAllSupportMethods(), fetchSupportConfig()])
      return { methods, enabled: config.enabled }
    },
    enabled,
  })

  const enabledMutation = useMutation({
    mutationFn: setSupportEnabled,
    onSuccess: invalidate,
  })
  const createMutation = useMutation({
    mutationFn: createSupportMethod,
    onSuccess: invalidate,
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<SupportMethodInput> }) =>
      updateSupportMethod(id, patch),
    onSuccess: invalidate,
  })
  const removeMutation = useMutation({
    mutationFn: deleteSupportMethod,
    onSuccess: invalidate,
  })

  return {
    methods: query.data?.methods,
    enabled: query.data?.enabled,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    setEnabled: enabledMutation.mutateAsync,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: removeMutation.mutateAsync,
    isMutating:
      enabledMutation.isPending ||
      createMutation.isPending ||
      updateMutation.isPending ||
      removeMutation.isPending,
  }
}
