/** Namespaced React Query keys for the habits feature. */
export const habitKeys = {
  all: (userId: string) => ['habits', userId] as const,
  /** Logs across a recent window ending on `date` (drives today + sparklines). */
  recentLogs: (userId: string, date: string) => ['habitLogs', userId, 'recent', date] as const,
}
