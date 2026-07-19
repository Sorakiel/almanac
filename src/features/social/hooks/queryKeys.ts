/** Namespaced React Query keys for the social module. */
export const socialKeys = {
  friendships: (userId: string) => ['friendships', userId] as const,
  activity: (userId: string) => ['friendActivity', userId] as const,
  search: (query: string) => ['userSearch', query] as const,
}
