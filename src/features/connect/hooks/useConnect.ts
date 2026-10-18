import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  decideOAuthRequest,
  disconnectApp,
  fetchConnectedApps,
  fetchOAuthRequest,
} from '@/features/connect/api/connect.api'
import { useSession } from '@/hooks/useSession'

export const connectKeys = {
  request: (id: string) => ['oauthRequest', id] as const,
  apps: (userId: string) => ['connectedApps', userId] as const,
}

/** The pending sign-in request; one try — an expired one stays expired. */
export function useOAuthRequest(id: string | null) {
  return useQuery({
    queryKey: connectKeys.request(id ?? ''),
    queryFn: () => fetchOAuthRequest(id!),
    enabled: Boolean(id),
    retry: false,
    staleTime: Infinity,
    gcTime: 0,
  })
}

/** Live on purpose (no offline queue): the app is waiting on the answer now. */
export function useDecideOAuthRequest() {
  return useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      decideOAuthRequest(id, approve),
  })
}

export function useConnectedApps(enabled: boolean) {
  const { user } = useSession()
  return useQuery({
    queryKey: connectKeys.apps(user?.id ?? ''),
    queryFn: fetchConnectedApps,
    enabled: enabled && Boolean(user),
  })
}

export function useDisconnectApp() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  return useMutation({
    mutationFn: disconnectApp,
    onSettled: () => queryClient.invalidateQueries({ queryKey: connectKeys.apps(user?.id ?? '') }),
  })
}
