import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, MessageSquare, ShieldCheck, Users } from 'lucide-react'
import { IconTile } from '@/components/common/IconTile'
import { SectionLabel } from '@/components/common/SectionLabel'
import { Tag } from '@/components/common/Tag'
import { useProfile } from '@/features/settings/hooks/useProfile'

const TOOLS = [
  { key: 'users', title: 'Members', sub: 'View and manage people', icon: Users },
  { key: 'feedback', title: 'Feedback', sub: 'Review submitted feedback', icon: MessageSquare },
]

/** Admin-only console. Gated by profile role; non-admins are bounced home. */
function AdminPage() {
  const navigate = useNavigate()
  const { profile, isLoading } = useProfile()

  if (isLoading) {
    return (
      <div className="flex justify-center py-24" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-accent" aria-hidden="true" />
        <span className="sr-only">Loading…</span>
      </div>
    )
  }

  if (profile?.role !== 'admin') return <Navigate to="/" replace />

  return (
    <div className="flex flex-col gap-5 lg:max-w-[760px]">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/settings')}
          aria-label="Back"
          className="rounded-full p-1 text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <div>
          <p className="label-mono text-accent">// admin</p>
          <h1 className="text-2xl">Console</h1>
        </div>
      </header>

      <div className="flex items-center gap-3 rounded-card border border-accent/25 bg-surface p-4">
        <IconTile icon={ShieldCheck} tone="bg-accent/15 text-accent" />
        <div>
          <p className="font-semibold">You have admin access</p>
          <p className="text-sm text-muted">Elevated tools for the whole workspace live here.</p>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <SectionLabel>TOOLS</SectionLabel>
        <div className="flex flex-col gap-2">
          {TOOLS.map((tool) => (
            <div key={tool.key} className="flex items-center gap-3 rounded-card border bg-surface/50 p-4">
              <IconTile icon={tool.icon} tone="bg-border/10 text-muted" size="sm" />
              <div className="flex-1">
                <p className="text-sm font-medium">{tool.title}</p>
                <p className="text-sm text-muted">{tool.sub}</p>
              </div>
              <Tag tone="muted">Soon</Tag>
            </div>
          ))}
        </div>
        <p className="label-mono normal-case tracking-normal text-muted">
          Cross-user tools need admin RLS policies — wiring them up is next.
        </p>
      </section>
    </div>
  )
}

export default AdminPage
