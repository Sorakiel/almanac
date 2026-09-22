/** Namespaced React Query keys for the workouts feature. */
export const workoutKeys = {
  all: (userId: string) => ['workouts', userId] as const,
  detail: (workoutId: string) => ['workout', workoutId] as const,
  session: (workoutId: string) => ['workoutSession', workoutId] as const,
  exerciseLibrary: (userId: string) => ['exerciseLibrary', userId] as const,
}
