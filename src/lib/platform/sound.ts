import { usePrefsStore } from '@/stores/prefs'
import type { CelebrationKind } from '@/stores/celebration'

/**
 * Tiny WebAudio chimes for celebrations — no assets, synthesised on the fly.
 * Silent unless the user has opted into sound (Settings → Sound effects), and
 * a no-op where WebAudio is unavailable. Kept deliberately short and quiet: a
 * terminal blip, not a fanfare.
 */

type AudioCtor = typeof AudioContext
let ctx: AudioContext | null = null

function context(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor: AudioCtor | undefined =
    window.AudioContext ?? (window as { webkitAudioContext?: AudioCtor }).webkitAudioContext
  if (!Ctor) return null
  ctx ??= new Ctor()
  return ctx
}

// A rising two-note motif per kind — bigger moments get the higher lift.
const NOTES: Record<CelebrationKind, number[]> = {
  milestone: [523.25, 659.25], // C5 → E5
  'perfect-day': [523.25, 783.99], // C5 → G5
  pr: [587.33, 880.0], // D5 → A5
  achievement: [523.25, 659.25, 987.77], // C5 → E5 → B5
}

export function playChime(kind: CelebrationKind): void {
  if (!usePrefsStore.getState().sound) return
  const audio = context()
  if (!audio) return
  if (audio.state === 'suspended') void audio.resume()

  const now = audio.currentTime
  NOTES[kind].forEach((freq, i) => {
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.type = 'triangle'
    osc.frequency.value = freq
    const start = now + i * 0.09
    // Quick pluck envelope so notes stay crisp and unobtrusive.
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22)
    osc.connect(gain).connect(audio.destination)
    osc.start(start)
    osc.stop(start + 0.24)
  })
}
