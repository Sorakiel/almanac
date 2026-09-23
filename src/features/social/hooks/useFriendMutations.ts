import { toast } from 'sonner'
import { useSession } from '@/hooks/useSession'
import { useOfflineMutation } from '@/hooks/useOfflineMutation'
import { OFFLINE_MUTATION_KEYS } from '@/lib/offlineMutations'
import { toUserError } from '@/lib/userError'
import { useT } from '@/hooks/useT'

/** Send / accept / remove friend requests; refresh the friends list on settle. */
export function useFriendMutations() {
  const { t } = useT()
  const { user } = useSession()
  const userId = user?.id ?? ''

  const send = useOfflineMutation(
    OFFLINE_MUTATION_KEYS.sendFriendRequest,
    (addresseeId: string) => ({ requesterId: userId, addresseeId }),
    {
      onSuccess: () => toast.success(t('social.requestSent')),
      onError: (error) => toast.error(toUserError(error, t, 'social.requestFailed')),
    },
  )
  const accept = useOfflineMutation(
    OFFLINE_MUTATION_KEYS.acceptFriendRequest,
    (friendshipId: string) => ({ friendshipId, userId }),
    {
      onSuccess: () => toast.success(t('social.nowFriends')),
      onError: (error) => toast.error(toUserError(error, t, 'social.acceptFailed')),
    },
  )
  const remove = useOfflineMutation(
    OFFLINE_MUTATION_KEYS.removeFriendship,
    (friendshipId: string) => ({ friendshipId, userId }),
    { onError: (error) => toast.error(toUserError(error, t, 'social.genericError')) },
  )

  return { send, accept, remove }
}
