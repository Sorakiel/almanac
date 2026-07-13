import { useMutation } from '@tanstack/react-query'
import {
  requestPasswordReset,
  signInWithMagicLink,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  updatePassword,
} from '@/features/auth/api/auth.api'

/** Mutations for the auth flows. Session state updates arrive via the listener. */
export function useAuthActions() {
  const signIn = useMutation({ mutationFn: signInWithPassword })
  const signUp = useMutation({ mutationFn: signUpWithPassword })
  const magicLink = useMutation({ mutationFn: signInWithMagicLink })
  const logOut = useMutation({ mutationFn: signOut })
  const resetRequest = useMutation({ mutationFn: requestPasswordReset })
  const setPassword = useMutation({ mutationFn: updatePassword })
  return { signIn, signUp, magicLink, logOut, resetRequest, setPassword }
}
