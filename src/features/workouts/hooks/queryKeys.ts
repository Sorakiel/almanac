/** Namespaced React Query keys for the workouts feature. */
export const workoutKeys = {
  all: (userId: string) => ['workouts', userId] as const,
  detail: (workoutId: string) => ['workout', workoutId] as const,
  /** Every day's session view of a workout — the invalidation root. */
  session: (workoutId: string) => ['workoutSession', workoutId] as const,
  /** The session view as of a local day, so a rollover shows a fresh day. */
  sessionOn: (workoutId: string, today: string) => ['workoutSession', workoutId, today] as const,
  exerciseLibrary: (userId: string) => ['exerciseLibrary', userId] as const,
}
