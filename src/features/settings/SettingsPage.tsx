import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  AlarmClock,
  Bell,
  ChevronRight,
  Clock,
  Coffee,
  Download,
  Laptop,
  Moon,
  ShieldCheck,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Segmented } from '@/components/ui/segmented'
import { Avatar } from '@/components/common/Avatar'
import { SectionLabel } from '@/components/common/SectionLabel'
import { Tag } from '@/components/common/Tag'
import { Rail } from '@/components/common/desktop/rail'
import { SettingsRail } from '@/features/settings/components/SettingsRail'
import { TimezoneSheet } from '@/features/settings/components/TimezoneSheet'
import { ReminderSheet } from '@/features/settings/components/ReminderSheet'
import { BackgroundSheet } from '@/features/settings/components/BackgroundSheet'
import { reminderTimeLabel } from '@/features/settings/lib/reminder'
import { isDesktopApp } from '@/lib/desktop'
import { APP_VERSION } from '@/lib/version'
import { useDesktopStore } from '@/stores/desktop'
import { useSession } from '@/hooks/useSession'
import { useTheme } from '@/hooks/useTheme'
import { useToday } from '@/hooks/useToday'
import { useAuthActions } from '@/features/auth/hooks/useAuthActions'
import { useProfile } from '@/features/settings/hooks/useProfile'
import { browserTimezone } from '@/lib/date'

function SettingsPage() {
  const navigate = useNavigate()
  const { user, status } = useSession()
  const { theme, setTheme } = useTheme()
  const { logOut } = useAuthActions()
  const { profile } = useProfile()
  const { dateKey } = useToday()
  const [timezoneOpen, setTimezoneOpen] = useState(false)
  const [reminderOpen, setReminderOpen] = useState(false)
  const [backgroundOpen, setBackgroundOpen] = useState(false)
  const runInBackground = useDesktopStore((s) => s.runInBackground)
  const showDesktop = isDesktopApp()

  if (status === 'anonymous') return <Navigate to="/auth" replace />

  const name = (user?.user_metadata.display_name as string | undefined) ?? 'Almanac user'
  const email = user?.email ?? ''
  const joinedDays = user?.created_at
    ? Math.max(
        1,
        Math.floor((new Date(dateKey).getTime() - new Date(user.created_at).getTime()) / 86_400_000),
      )
    : 0
  const soon = () => toast('This setting is coming soon.')
  const reminderEnabled = profile?.reminder_enabled ?? false
  const reminderHour = profile?.reminder_hour ?? 8

  const handleSignOut = async () => {
    try {
      await logOut.mutateAsync()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not sign out')
    }
  }

  return (
    <>
      <div className="flex flex-col gap-6 lg:mx-auto lg:max-w-[760px]">
        <header className="flex items-center gap-4">
          <Avatar name={name} size="lg" />
          <div className="min-w-0">
            <h1 className="truncate text-xl">{name}</h1>
            <p className="truncate text-sm text-muted">{email}</p>
            <Tag tone="accent" className="mt-1.5">
              ◇ {profile?.role && profile.role !== 'user' ? profile.role : 'member'} · {joinedDays}-day
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

        <section className="flex flex-col gap-2">
          <SectionLabel>YOU</SectionLabel>
          <div className="flex flex-col">
            <Row
              icon={Trophy}
              label="Achievements"
              onClick={() => navigate('/achievements')}
            />
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <SectionLabel>ACCOUNT</SectionLabel>
          <div className="flex flex-col">
            <Row
              icon={Clock}
              label="Timezone"
              value={(profile?.timezone ?? browserTimezone()).replace(/_/g, ' ')}
              onClick={() => setTimezoneOpen(true)}
            />
            <Row
              icon={reminderEnabled ? AlarmClock : Bell}
              label="Daily reminder"
              value={reminderEnabled ? reminderTimeLabel(reminderHour) : 'Off'}
              onClick={() => setReminderOpen(true)}
            />
            <Row icon={Download} label="Export data" onClick={soon} />
          </div>
        </section>

        {showDesktop ? (
          <section className="flex flex-col gap-2">
            <SectionLabel>DESKTOP</SectionLabel>
            <div className="flex flex-col">
              <Row
                icon={Laptop}
                label="Run in background"
                value={runInBackground ? 'On' : 'Off'}
                onClick={() => setBackgroundOpen(true)}
              />
            </div>
          </section>
        ) : null}

        {profile?.role === 'admin' || profile?.role === 'owner' ? (
          <section className="flex flex-col gap-1">
            <SectionLabel className="mb-2">ADMIN</SectionLabel>
            <Row icon={ShieldCheck} label="Admin console" onClick={() => navigate('/admin')} />
          </section>
        ) : null}

        <Button
          variant="surface"
          className="w-full text-accent"
          onClick={handleSignOut}
          disabled={logOut.isPending}
        >
          Sign out
        </Button>

        <p className="label-mono text-center">ALMANAC v{APP_VERSION} · ◇</p>
      </div>
      <Rail>
        <SettingsRail />
      </Rail>
      {timezoneOpen ? (
        <TimezoneSheet
          open
          onOpenChange={setTimezoneOpen}
          current={profile?.timezone ?? browserTimezone()}
        />
      ) : null}
      {reminderOpen ? (
        <ReminderSheet
          open
          onOpenChange={setReminderOpen}
          enabled={reminderEnabled}
          hour={reminderHour}
        />
      ) : null}
      {backgroundOpen ? <BackgroundSheet open onOpenChange={setBackgroundOpen} /> : null}
    </>
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
      className="flex items-center gap-3 border-t border-border/10 px-1 py-3.5 text-left transition-colors first:border-t-0 hover:text-accent"
    >
      <Icon className="h-4 w-4 text-muted" aria-hidden="true" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      {value ? <span className="label-mono normal-case tracking-normal">{value}</span> : null}
      <ChevronRight className="h-4 w-4 text-muted-strong" aria-hidden="true" />
    </button>
  )
}

export default SettingsPage
