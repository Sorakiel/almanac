import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useSession } from '@/hooks/useSession'
import {
  acceptFriendRequest,
  removeFriendship,
  sendFriendRequest,
} from '@/features/social/api/social.api'
import { socialKeys } from '@/features/social/hooks/queryKeys'

/** Send / accept / remove friend requests; refresh the friends list on settle. */
export function useFriendMutations() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const userId = user?.id ?? ''
  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: socialKeys.friendships(userId) })

  const send = useMutation({
    mutationFn: (addresseeId: string) => sendFriendRequest(userId, addresseeId),
    onSuccess: () => {
      toast.success('Friend request sent')
      invalidate()
    },
    onError: () => toast.error("Couldn't send the request"),
  })

  const accept = useMutation({
    mutationFn: (friendshipId: string) => acceptFriendRequest(friendshipId),
    onSuccess: () => {
      toast.success("You're now friends")
      invalidate()
    },
    onError: () => toast.error("Couldn't accept the request"),
  })

  const remove = useMutation({
    mutationFn: (friendshipId: string) => removeFriendship(friendshipId),
    onSuccess: invalidate,
    onError: () => toast.error('Something went wrong'),
  })

  return { send, accept, remove }
}
