/** Namespaced React Query keys for the settings feature. */
export const settingsKeys = {
  userSettings: (userId: string) => ['userSettings', userId] as const,
}
