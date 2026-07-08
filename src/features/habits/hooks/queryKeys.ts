/** Namespaced React Query keys for the habits feature. */
export const habitKeys = {
  all: (userId: string) => ['habits', userId] as const,
  logsForDate: (userId: string, date: string) => ['habitLogs', userId, date] as const,
}
