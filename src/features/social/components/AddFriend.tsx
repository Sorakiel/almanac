import { useState } from 'react'
import { Loader2, Search, UserPlus } from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUserSearch } from '@/features/social/hooks/useUserSearch'
import type { FriendProfile } from '@/features/social/types'

interface AddFriendProps {
  /** Ids already connected (friend or pending) — hidden from results. */
  connectedIds: Set<string>
  selfId: string
  onAdd: (userId: string) => void
  isAdding: boolean
}

/** Search people by name and send a friend request. */
export function AddFriend({ connectedIds, selfId, onAdd, isAdding }: AddFriendProps) {
  const [query, setQuery] = useState('')
  const { results, isSearching } = useUserSearch(query)
  const shown = results.filter((r) => r.id !== selfId && !connectedIds.has(r.id))
  const trimmed = query.trim()

  return (
    <div className="flex flex-col gap-3 rounded-card border bg-surface p-4">
      <label htmlFor="friend-search" className="label-mono">
        // add a friend
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-strong"
          aria-hidden="true"
        />
        <Input
          id="friend-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name…"
          className="pl-10"
          autoComplete="off"
        />
      </div>

      {trimmed.length >= 2 ? (
        <div className="flex flex-col gap-1.5">
          {isSearching && shown.length === 0 ? (
            <p className="flex items-center gap-2 py-2 text-sm text-muted">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Searching…
            </p>
          ) : shown.length === 0 ? (
            <p className="py-2 text-sm text-muted">No one found by that name.</p>
          ) : (
            shown.map((person: FriendProfile) => (
              <div key={person.id} className="flex items-center gap-3 rounded-xl px-1 py-1.5">
                <Avatar name={person.displayName} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {person.displayName}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isAdding}
                  onClick={() => onAdd(person.id)}
                >
                  <UserPlus className="h-4 w-4" aria-hidden="true" />
                  Add
                </Button>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}
