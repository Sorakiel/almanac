import { useMutation } from '@tanstack/react-query'
import {
  requestPasswordReset,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  updatePassword,
} from '@/features/auth/api/auth.api'

/** Mutations for the auth flows. Session state updates arrive via the listener. */
export function useAuthActions() {
  const signIn = useMutation({ mutationFn: signInWithPassword })
  const signUp = useMutation({ mutationFn: signUpWithPassword })
  const logOut = useMutation({ mutationFn: signOut })
  const resetRequest = useMutation({ mutationFn: requestPasswordReset })
  const setPassword = useMutation({ mutationFn: updatePassword })
  return { signIn, signUp, logOut, resetRequest, setPassword }
}
