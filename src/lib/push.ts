import { supabase } from '@/lib/supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

export type PushState = 'unsupported' | 'blocked' | 'off' | 'on'

/** Web Push needs a service worker, the Push API, and permission to notify. */
export function pushSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    Boolean(VAPID_PUBLIC_KEY)
  )
}

/**
 * VAPID keys travel as base64url; PushManager wants raw bytes. Backed by an
 * explicit ArrayBuffer because `applicationServerKey` rejects the
 * possibly-shared buffer that a plain Uint8Array is typed with.
 */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
  const raw = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i)
  return bytes
}

function keyToBase64(subscription: PushSubscription, name: 'p256dh' | 'auth'): string {
  const key = subscription.getKey(name)
  if (key === null) throw new Error(`Push subscription is missing its ${name} key`)
  return btoa(String.fromCharCode(...new Uint8Array(key)))
}

async function registration(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register('/sw.js', { scope: '/' })
}

/** Current state, without prompting for anything. */
export async function currentPushState(): Promise<PushState> {
  if (!pushSupported()) return 'unsupported'
  if (Notification.permission === 'denied') return 'blocked'
  const existing = await (
    await navigator.serviceWorker.getRegistration('/')
  )?.pushManager.getSubscription()
  return existing ? 'on' : 'off'
}

/**
 * Ask for permission, subscribe, and store the endpoint.
 *
 * Upsert on `endpoint`, not on user: the same browser re-subscribing must
 * refresh its keys rather than leave a dead row behind that we would keep
 * pushing to forever.
 */
export async function enablePush(userId: string): Promise<PushState> {
  if (!pushSupported()) return 'unsupported'

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return permission === 'denied' ? 'blocked' : 'off'

  const reg = await registration()
  const subscription =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!),
    }))

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: keyToBase64(subscription, 'p256dh'),
      auth: keyToBase64(subscription, 'auth'),
      user_agent: navigator.userAgent.slice(0, 200),
    },
    { onConflict: 'endpoint' },
  )
  if (error) throw error

  return 'on'
}

/** Unsubscribe this browser and forget its endpoint. */
export async function disablePush(): Promise<PushState> {
  const reg = await navigator.serviceWorker.getRegistration('/')
  const subscription = await reg?.pushManager.getSubscription()
  if (!subscription) return 'off'

  const endpoint = subscription.endpoint
  await subscription.unsubscribe()
  const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
  if (error) throw error
  return 'off'
}
