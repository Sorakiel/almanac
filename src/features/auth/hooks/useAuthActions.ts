import { useMutation } from '@tanstack/react-query'
import { signInWithPassword, signOut, signUpWithPassword } from '@/features/auth/api/auth.api'

/** Mutations for the auth flows. Session state updates arrive via the listener. */
export function useAuthActions() {
  const signIn = useMutation({ mutationFn: signInWithPassword })
  const signUp = useMutation({ mutationFn: signUpWithPassword })
  const logOut = useMutation({ mutationFn: signOut })
  return { signIn, signUp, logOut }
}
