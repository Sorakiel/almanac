import type { TFunction } from '@/hooks/useT'
import type { TranslationKey } from '@/i18n/types'

// Human wording for each permission in oauth.scopes. A scope added on the
// server without a line here still shows — as its raw name — so the user is
// never asked to approve something the modal leaves out.
const LABELS: Record<string, TranslationKey> = {
  'habits:read': 'connect.scopeHabitsRead',
  'habits:write': 'connect.scopeHabitsWrite',
}

export function scopeLabel(scope: string, t: TFunction): string {
  const key = LABELS[scope]
  return key ? t(key) : scope
}
