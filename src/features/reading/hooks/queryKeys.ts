/** Namespaced React Query keys for the reading feature. */
export const readingKeys = {
  books: (userId: string) => ['books', userId] as const,
  book: (bookId: string) => ['book', bookId] as const,
  notes: (bookId: string) => ['bookNotes', bookId] as const,
  sessions: (bookId: string) => ['readingSessions', bookId] as const,
}
