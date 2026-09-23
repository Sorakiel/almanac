/** Namespaced React Query keys for the reflect feature. */
export const reflectKeys = {
  all: (userId: string) => ['reflections', userId] as const,
}
