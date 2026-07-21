import { useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Tag } from '@/components/common/Tag'
import { SupportMethodSheet } from '@/features/admin/components/SupportMethodSheet'
import { useSupportAdmin } from '@/features/admin/hooks/useSupportAdmin'
import { SUPPORT_KIND_ICON, isMethodLive, type SupportMethod } from '@/features/settings/lib/support'

/**
 * Owner-only console block: flip whether users see the Support section at all,
 * and manage which donation methods appear (add, edit, show/hide, remove).
 */
export function SupportManager() {
  const { methods, enabled, isLoading, isError, setEnabled } = useSupportAdmin(true)
  const [editing, setEditing] = useState<SupportMethod | null>(null)
  const [creating, setCreating] = useState(false)

  const toggleSection = async (next: boolean) => {
    try {
      await setEnabled(next)
      toast.success(next ? 'Support section shown to users' : 'Support section hidden')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8" role="status" aria-live="polite">
        <Loader2 className="h-5 w-5 animate-spin text-accent" aria-hidden="true" />
        <span className="sr-only">Loading support config…</span>
      </div>
    )
  }
  if (isError || !methods) {
    return (
      <p className="rounded-card border bg-surface px-4 py-6 text-center text-sm text-muted">
        Couldn’t load the support config.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      <label className="flex items-center justify-between rounded-card border bg-surface px-4 py-3.5">
        <span className="min-w-0">
          <span className="block text-sm font-medium">Show Support section</span>
          <span className="block text-xs text-muted">
            Off hides “Support Almanac” from everyone’s settings.
          </span>
        </span>
        <Switch
          checked={enabled ?? false}
          onCheckedChange={(v) => void toggleSection(v)}
          aria-label="Show Support section to users"
        />
      </label>

      {methods.length === 0 ? (
        <p className="rounded-card border bg-surface px-4 py-6 text-center text-sm text-muted">
          No methods yet — add one below.
        </p>
      ) : (
        methods.map((method) => (
          <MethodRow key={method.id} method={method} onEdit={() => setEditing(method)} />
        ))
      )}

      <Button variant="surface" size="sm" className="self-start" onClick={() => setCreating(true)}>
        <Plus className="h-4 w-4" /> Add method
      </Button>

      {creating ? <SupportMethodSheet open onOpenChange={setCreating} /> : null}
      {editing ? (
        <SupportMethodSheet
          open
          onOpenChange={(o) => !o && setEditing(null)}
          method={editing}
        />
      ) : null}
    </div>
  )
}

interface MethodRowProps {
  method: SupportMethod
  onEdit: () => void
}

function MethodRow({ method, onEdit }: MethodRowProps) {
  const { update } = useSupportAdmin(false)
  const Icon = SUPPORT_KIND_ICON[method.kind]
  const live = isMethodLive(method)

  const toggle = async (next: boolean) => {
    try {
      await update({ id: method.id, patch: { enabled: next } })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update')
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-card border bg-surface px-4 py-3">
      <button type="button" onClick={onEdit} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <Icon className="h-[18px] w-[18px] shrink-0 text-muted-strong" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-[15px] font-medium">{method.label}</span>
            {method.network ? <Tag tone="teal">{method.network}</Tag> : null}
            {!live ? <Tag tone="amber">soon</Tag> : null}
          </span>
          <span className="block truncate font-mono text-[11px] text-muted">
            {method.value || '— no link/address yet —'}
          </span>
        </span>
      </button>
      <Switch
        checked={method.enabled}
        onCheckedChange={(v) => void toggle(v)}
        aria-label={`Show ${method.label} to users`}
      />
    </div>
  )
}
