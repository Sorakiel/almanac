import { useState } from 'react'
import { Check, Copy, ExternalLink, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Sheet } from '@/components/ui/sheet'
import { Tag } from '@/components/common/Tag'
import { useSupportConfig } from '@/features/settings/hooks/useSupportConfig'
import { SUPPORT_KIND_ICON, isMethodLive, type SupportMethod } from '@/features/settings/lib/support'

interface SupportSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * "Support Almanac" — links out to Boosty (fiat from RU) and copies crypto
 * addresses (worldwide). Methods come from the owner-managed `support_methods`
 * table; no in-app payments, we only hand off the link or the address.
 */
export function SupportSheet({ open, onOpenChange }: SupportSheetProps) {
  const { config, isLoading, isError } = useSupportConfig()
  const methods = config?.methods ?? []

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Support Almanac"
      description="Almanac is free. If it earns a place in your day, you can chip in — it keeps the lights on."
    >
      <div className="flex flex-col gap-2.5">
        {isLoading ? (
          <div className="flex justify-center py-8" role="status" aria-live="polite">
            <Loader2 className="h-5 w-5 animate-spin text-accent" aria-hidden="true" />
            <span className="sr-only">Loading support options…</span>
          </div>
        ) : isError ? (
          <p className="rounded-tile border bg-surface px-4 py-6 text-center text-sm text-muted">
            Couldn’t load support options. Please try again later.
          </p>
        ) : methods.length === 0 ? (
          <p className="rounded-tile border bg-surface px-4 py-6 text-center text-sm text-muted">
            No support options are available right now.
          </p>
        ) : (
          methods.map((method) => <MethodRow key={method.id} method={method} />)
        )}
        {methods.length > 0 ? (
          <p className="mt-1 px-1 text-center text-xs text-muted">
            Thank you — support is optional and never unlocks features.
          </p>
        ) : null}
      </div>
    </Sheet>
  )
}

function MethodRow({ method }: { method: SupportMethod }) {
  const [copied, setCopied] = useState(false)
  const live = isMethodLive(method)
  const Icon = SUPPORT_KIND_ICON[method.kind]

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(method.value)
      setCopied(true)
      toast.success(`${method.network ?? method.label} address copied`)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      toast.error('Could not copy — long-press to select instead')
    }
  }

  const base = 'flex items-center gap-3 rounded-tile border bg-surface px-4 py-3.5 text-left'

  if (!live) {
    return (
      <div className={`${base} opacity-60`}>
        <Icon className="h-[18px] w-[18px] text-muted-strong" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-medium">{method.label}</span>
          {method.hint ? <span className="block truncate text-xs text-muted">{method.hint}</span> : null}
        </span>
        <Tag tone="muted">soon</Tag>
      </div>
    )
  }

  if (method.kind === 'link') {
    return (
      <a
        href={method.value}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} transition-colors hover:border-accent/40 hover:text-accent`}
      >
        <Icon className="h-[18px] w-[18px] text-accent" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-medium">{method.label}</span>
          {method.hint ? <span className="block truncate text-xs text-muted">{method.hint}</span> : null}
        </span>
        <ExternalLink className="h-4 w-4 text-muted-strong" aria-hidden="true" />
      </a>
    )
  }

  return (
    <button type="button" onClick={() => void copyAddress()} className={`${base} w-full`}>
      <Icon className="h-[18px] w-[18px] text-accent" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-[15px] font-medium">{method.label}</span>
          {method.network ? <Tag tone="teal">{method.network}</Tag> : null}
        </span>
        <span className="block truncate font-mono text-[11px] text-muted">{method.value}</span>
      </span>
      {copied ? (
        <Check className="h-4 w-4 text-teal" aria-hidden="true" />
      ) : (
        <Copy className="h-4 w-4 text-muted-strong" aria-hidden="true" />
      )}
    </button>
  )
}
