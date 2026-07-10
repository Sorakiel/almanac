import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Bell, ChevronRight, Clock, Coffee, Download, Moon, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Segmented } from '@/components/ui/segmented'
import { Avatar } from '@/components/common/Avatar'
import { SectionLabel } from '@/components/common/SectionLabel'
import { Tag } from '@/components/common/Tag'
import { useSession } from '@/hooks/useSession'
import { useTheme } from '@/hooks/useTheme'
import { useAuthActions } from '@/features/auth/hooks/useAuthActions'
import { useProfile } from '@/features/settings/hooks/useProfile'
import { browserTimezone } from '@/lib/date'

function SettingsPage() {
  const { user, status } = useSession()
  const { theme, setTheme } = useTheme()
  const { logOut } = useAuthActions()
  const { profile } = useProfile()

  if (status === 'anonymous') return <Navigate to="/auth" replace />

  const name = (user?.user_metadata.display_name as string | undefined) ?? 'Almanac user'
  const email = user?.email ?? ''
  const soon = () => toast('This setting is coming soon.')

  const handleSignOut = async () => {
    try {
      await logOut.mutateAsync()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not sign out')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-4">
        <Avatar name={name} size="lg" />
        <div className="min-w-0">
          <h1 className="truncate text-xl">{name}</h1>
          <p className="truncate text-sm text-muted">{email}</p>
          <Tag tone="accent" className="mt-1.5">
            ◇ {profile?.role === 'admin' ? 'Admin' : 'Member'}
          </Tag>
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <SectionLabel>APPEARANCE</SectionLabel>
        <Segmented
          aria-label="Theme"
          value={theme}
          onChange={setTheme}
          options={[
            { value: 'dark', label: 'Dark', icon: Moon },
            { value: 'coffee', label: 'Coffee', icon: Coffee },
          ]}
        />
      </section>

      <section className="flex flex-col gap-1">
        <SectionLabel className="mb-2">ACCOUNT</SectionLabel>
        <Row icon={Clock} label="Timezone" value={browserTimezone()} onClick={soon} />
        <Row icon={Bell} label="Notifications" value="Off" onClick={soon} />
        <Row icon={Download} label="Export data" onClick={soon} />
      </section>

      <Button variant="surface" className="w-full text-accent" onClick={handleSignOut} disabled={logOut.isPending}>
        Sign out
      </Button>

      <p className="text-center label-mono">ALMANAC v0.1 · ◇</p>
    </div>
  )
}

interface RowProps {
  icon: LucideIcon
  label: string
  value?: string
  onClick: () => void
}

function Row({ icon: Icon, label, value, onClick }: RowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl px-2 py-3 text-left transition-colors hover:bg-surface"
    >
      <Icon className="h-4 w-4 text-muted" aria-hidden="true" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      {value ? <span className="label-mono normal-case tracking-normal">{value}</span> : null}
      <ChevronRight className="h-4 w-4 text-muted-strong" aria-hidden="true" />
    </button>
  )
}

export default SettingsPage
