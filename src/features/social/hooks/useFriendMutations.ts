import { useMutation, type MutateOptions } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useSession } from '@/hooks/useSession'
import {
  OFFLINE_MUTATION_KEYS,
  type AcceptFriendRequestVariables,
  type RemoveFriendshipVariables,
  type SendFriendRequestVariables,
} from '@/lib/offlineMutations'
import { useT } from '@/hooks/useT'

/**
 * Send / accept / remove friend requests; refresh the friends list on
 * settle. mutationFn and the settle invalidation live once in
 * registerOfflineMutations (src/lib/offlineMutations.ts) — see
 * useToggleHabit for why.
 */
export function useFriendMutations() {
  const { t } = useT()
  const { user } = useSession()
  const userId = user?.id ?? ''

  const sendMutation = useMutation<void, Error, SendFriendRequestVariables>({
    mutationKey: OFFLINE_MUTATION_KEYS.sendFriendRequest,
    onSuccess: () => toast.success(t('social.requestSent')),
    onError: () => toast.error(t('social.requestFailed')),
  })
  const send = {
    ...sendMutation,
    mutate: (
      addresseeId: string,
      options?: MutateOptions<void, Error, SendFriendRequestVariables>,
    ) => sendMutation.mutate({ requesterId: userId, addresseeId }, options),
    mutateAsync: (addresseeId: string) =>
      sendMutation.mutateAsync({ requesterId: userId, addresseeId }),
  }

  const acceptMutation = useMutation<void, Error, AcceptFriendRequestVariables>({
    mutationKey: OFFLINE_MUTATION_KEYS.acceptFriendRequest,
    onSuccess: () => toast.success("You're now friends"),
    onError: () => toast.error("Couldn't accept the request"),
  })
  const accept = {
    ...acceptMutation,
    mutate: (
      friendshipId: string,
      options?: MutateOptions<void, Error, AcceptFriendRequestVariables>,
    ) => acceptMutation.mutate({ friendshipId, userId }, options),
    mutateAsync: (friendshipId: string) => acceptMutation.mutateAsync({ friendshipId, userId }),
  }

  const removeMutation = useMutation<void, Error, RemoveFriendshipVariables>({
    mutationKey: OFFLINE_MUTATION_KEYS.removeFriendship,
    onError: () => toast.error(t('social.genericError')),
  })
  const remove = {
    ...removeMutation,
    mutate: (
      friendshipId: string,
      options?: MutateOptions<void, Error, RemoveFriendshipVariables>,
    ) => removeMutation.mutate({ friendshipId, userId }, options),
    mutateAsync: (friendshipId: string) => removeMutation.mutateAsync({ friendshipId, userId }),
  }

  return { send, accept, remove }
}
