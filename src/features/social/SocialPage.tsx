import { useMemo } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Cascade } from '@/components/common/Cascade'
import { EmptyState } from '@/components/common/EmptyState'
import { Rail } from '@/components/common/desktop/rail'
import { AddFriend } from '@/features/social/components/AddFriend'
import { ActivityFeed } from '@/features/social/components/ActivityFeed'
import { RequestsList } from '@/features/social/components/RequestsList'
import { FriendsList } from '@/features/social/components/FriendsList'
import { SocialWorkspace } from '@/features/social/components/desktop/SocialWorkspace'
import { SocialRail } from '@/features/social/components/desktop/SocialRail'
import { useFriends } from '@/features/social/hooks/useFriends'
import { useFriendActivity } from '@/features/social/hooks/useFriendActivity'
import { useFriendMutations } from '@/features/social/hooks/useFriendMutations'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'

function SocialPage() {
  const { user } = useSession()
  const selfId = user?.id ?? ''
  const { dateKey } = useToday()
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const { data, friendIds, isLoading, isError, refetch } = useFriends()
  const { feed } = useFriendActivity(friendIds)
  const { send, accept, remove } = useFriendMutations()
  const busy = send.isPending || accept.isPending || remove.isPending

  // Everyone already linked (friend or pending, either way) — hidden from search.
  const connectedIds = useMemo(() => {
    const ids = new Set<string>([selfId])
    for (const f of data.friends) ids.add(f.id)
    for (const r of data.incoming) ids.add(r.profile.id)
    for (const r of data.outgoing) ids.add(r.profile.id)
    return ids
  }, [data, selfId])

  if (isLoading) {
    return (
      <div className="flex justify-center py-24" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-accent" aria-hidden="true" />
        <span className="sr-only">Loading your friends…</span>
      </div>
    )
  }

  if (isError) {
    return (
      <EmptyState
        icon={RefreshCw}
        title="Couldn't load your friends"
        description="Something went wrong reaching the server."
        action={
          <Button size="sm" variant="surface" onClick={refetch}>
            Try again
          </Button>
        }
      />
    )
  }

  if (isDesktop) {
    return (
      <>
        <SocialWorkspace
          data={data}
          feed={feed}
          todayKey={dateKey}
          selfId={selfId}
          connectedIds={connectedIds}
          onAdd={(id) => send.mutate(id)}
          isAdding={send.isPending}
        />
        <Rail>
          <SocialRail
            data={data}
            onAccept={(id) => accept.mutate(id)}
            onRemove={(id) => remove.mutate(id)}
            busy={busy}
          />
        </Rail>
      </>
    )
  }

  return (
    <section className="flex flex-col gap-6">
      <header>
        <p className="label-mono">// your circle</p>
        <h1 className="mt-1 text-2xl">Friends</h1>
      </header>

      <Cascade>
        <AddFriend
          connectedIds={connectedIds}
          selfId={selfId}
          onAdd={(id) => send.mutate(id)}
          isAdding={send.isPending}
        />

        <RequestsList
          incoming={data.incoming}
          outgoing={data.outgoing}
          onAccept={(id) => accept.mutate(id)}
          onRemove={(id) => remove.mutate(id)}
          busy={busy}
        />

        <section className="flex flex-col gap-3">
          <p className="label-mono">// activity</p>
          <ActivityFeed feed={feed} todayKey={dateKey} hasFriends={data.friends.length > 0} />
        </section>

        <FriendsList friends={data.friends} onRemove={(id) => remove.mutate(id)} busy={busy} />
      </Cascade>
    </section>
  )
}

export default SocialPage
