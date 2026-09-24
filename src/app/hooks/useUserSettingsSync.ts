import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchUserSettings } from '@/features/settings/api/userSettings.api'
import { settingsKeys } from '@/features/settings/hooks/queryKeys'
import {
  changed,
  fromRow,
  isEmpty,
  toPatch,
  type SyncedSettings,
  type UserSettingsPatch,
} from '@/features/settings/lib/userSettings'
import { useOfflineMutation } from '@/hooks/useOfflineMutation'
import { useSession } from '@/hooks/useSession'
import { OFFLINE_MUTATION_KEYS } from '@/lib/offlineMutations'
import { useLocaleStore } from '@/stores/locale'
import { useModulesStore } from '@/stores/modules'
import { usePrefsStore } from '@/stores/prefs'
import { useThemeStore } from '@/stores/theme'

/** What this device currently has, in the synced shape. */
function readLocal(): SyncedSettings {
  return {
    modules: useModulesStore.getState().enabled,
    theme: useThemeStore.getState().theme,
    locale: useLocaleStore.getState().locale,
    sound: usePrefsStore.getState().sound,
  }
}

/** Put the account's settings on this device, without animating or re-uploading them. */
function adopt(remote: SyncedSettings): void {
  if (remote.modules) useModulesStore.getState().adoptModules(remote.modules)
  if (remote.sound !== undefined && remote.sound !== usePrefsStore.getState().sound) {
    usePrefsStore.getState().setSound(remote.sound)
  }
  if (remote.theme && remote.theme !== useThemeStore.getState().theme) {
    useThemeStore.getState().adoptTheme(remote.theme)
  }
  if (remote.locale && remote.locale !== useLocaleStore.getState().locale) {
    useLocaleStore.getState().adoptLocale(remote.locale)
  }
}

/**
 * Keep the settings stores and the account's `user_settings` row in step.
 *
 * The stores stay the source for the first frame — theme and language must
 * paint before any network — and this makes them a cache of the row: the row
 * is applied when it arrives (newest write wins across devices), and every
 * local change is written through an offline-durable mutation.
 *
 * `synced` is what the row is believed to hold. A store change that matches it
 * is the row being applied, not a new choice, so it is never written back.
 */
export function useUserSettingsSync(): void {
  const { user } = useSession()
  const userId = user?.id ?? ''
  const queryClient = useQueryClient()
  const save = useOfflineMutation(
    OFFLINE_MUTATION_KEYS.saveUserSettings,
    (patch: UserSettingsPatch) => ({ userId, patch }),
  )
  // The store subscription lives across renders; it always reaches the latest mutate.
  const saveRef = useRef(save.mutate)
  useEffect(() => {
    saveRef.current = save.mutate
  })

  const synced = useRef<SyncedSettings | null>(null)
  const appliedAt = useRef<string | null>(null)
  // Stores update one by one while a row is applied; the half-applied states
  // in between are not choices and must not be written.
  const adopting = useRef(false)

  const { data: row, isSuccess } = useQuery({
    queryKey: settingsKeys.userSettings(userId),
    queryFn: () => fetchUserSettings(userId),
    enabled: Boolean(userId),
    // Another device may have changed something while this one was in the background.
    refetchOnWindowFocus: true,
  })

  // A different account on this device starts from scratch.
  useEffect(() => {
    synced.current = null
    appliedAt.current = null
  }, [userId])

  // Row → device.
  useEffect(() => {
    if (!isSuccess || !userId) return
    // An own write still queued is newer than whatever the server returned; its
    // settle refetch brings the row back once it has landed.
    if (queryClient.isMutating({ mutationKey: OFFLINE_MUTATION_KEYS.saveUserSettings }) > 0) return

    if (row === null) {
      // Never synced: this device's settings become the account's. A language
      // the device merely inherited from the browser is not a choice to share.
      if (synced.current) return
      const local = readLocal()
      synced.current = local
      const first = useLocaleStore.getState().chosen ? local : { ...local, locale: undefined }
      saveRef.current(toPatch(first))
      return
    }

    if (row.updated_at === appliedAt.current) return
    appliedAt.current = row.updated_at
    const remote = fromRow(row)
    adopting.current = true
    try {
      adopt(remote)
    } finally {
      adopting.current = false
    }
    // The language lands asynchronously (its dictionary loads first); record
    // it now so that later store update matches and is not written back.
    synced.current = { ...readLocal(), locale: remote.locale ?? readLocal().locale }
  }, [row, isSuccess, userId, queryClient])

  // Device → row.
  useEffect(() => {
    if (!userId) return
    const onChange = () => {
      if (!synced.current || adopting.current) return
      const next = readLocal()
      const diff = changed(synced.current, next)
      // Only a picked language is shared; an adopted one already came from the row.
      if (diff.locale !== undefined && !useLocaleStore.getState().chosen) delete diff.locale
      if (isEmpty(diff)) return
      synced.current = { ...synced.current, ...diff }
      saveRef.current(toPatch(diff))
    }
    const unsubscribe = [
      useThemeStore.subscribe(onChange),
      useLocaleStore.subscribe(onChange),
      useModulesStore.subscribe(onChange),
      usePrefsStore.subscribe(onChange),
    ]
    return () => unsubscribe.forEach((off) => off())
  }, [userId])
}
