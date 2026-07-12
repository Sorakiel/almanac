import { lastNDateKeys } from '@/lib/date'
import type {
  AdminData,
  Feedback,
  MemberRow,
  Profile,
  SignupWeek,
} from '@/features/admin/types'

const SIGNUP_WEEKS = 8
const RECENT_MEMBERS = 8

/** Display name fallback: the name, else the id's short prefix. */
function nameOf(p: Profile): string {
  return p.display_name?.trim() || `member-${p.id.slice(0, 6)}`
}

/** Bucket signups into the last SIGNUP_WEEKS calendar weeks, oldest→newest. */
function signupsByWeek(profiles: Profile[], todayKey: string): SignupWeek[] {
  const days = lastNDateKeys(todayKey, SIGNUP_WEEKS * 7)
  const firstDay = days[0]!
  const counts = new Array(SIGNUP_WEEKS).fill(0)
  for (const p of profiles) {
    const day = p.created_at.slice(0, 10)
    if (day < firstDay) continue
    const idx = days.indexOf(day)
    if (idx < 0) continue
    counts[Math.min(SIGNUP_WEEKS - 1, Math.floor(idx / 7))] += 1
  }
  return counts.map((count, i) => ({ label: `W${i + 1}`, count }))
}

/**
 * Assemble the admin console read-out from raw rows. Pure: signup bucketing is
 * done against `todayKey` (the admin's local date).
 */
export function computeAdmin(
  profiles: Profile[],
  activeUserIds: string[],
  totalHabits: number,
  totalLogs: number,
  feedback: Feedback[],
  todayKey: string,
): AdminData {
  const weekAgo = lastNDateKeys(todayKey, 7)[0]!
  const newThisWeek = profiles.filter((p) => p.created_at.slice(0, 10) >= weekAgo).length
  const admins = profiles.filter((p) => p.role === 'admin').length

  const nameById = new Map(profiles.map((p) => [p.id, nameOf(p)]))
  const members: MemberRow[] = profiles.slice(0, RECENT_MEMBERS).map((p) => ({
    id: p.id,
    name: nameOf(p),
    role: p.role,
    joinedAt: p.created_at,
  }))

  return {
    overview: {
      totalMembers: profiles.length,
      activeToday: activeUserIds.length,
      totalHabits,
      totalLogs,
      newThisWeek,
      admins,
    },
    signups: signupsByWeek(profiles, todayKey),
    members,
    feedback: feedback.map((f) => ({
      id: f.id,
      body: f.body,
      status: f.status,
      createdAt: f.created_at,
      authorName: nameById.get(f.user_id) ?? `member-${f.user_id.slice(0, 6)}`,
    })),
  }
}
