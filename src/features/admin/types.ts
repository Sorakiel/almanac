import type { Database } from '@/types/database.generated'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Feedback = Database['public']['Tables']['feedback']['Row']
export type FeedbackStatus = Database['public']['Enums']['feedback_status']

/** Workspace-wide KPIs shown across the top of the admin console. */
export interface AdminOverview {
  totalMembers: number
  activeToday: number
  totalHabits: number
  totalLogs: number
  /** Members who joined in the last 7 days. */
  newThisWeek: number
  /** Admin accounts among members. */
  admins: number
}

/** Signups in one calendar week, oldest→newest. */
export interface SignupWeek {
  label: string
  count: number
}

/** A member row for the recent-signups table. */
export interface MemberRow {
  id: string
  name: string
  role: string
  joinedAt: string
}

/** A feedback item joined with its author's display name. */
export interface FeedbackRow {
  id: string
  body: string
  status: FeedbackStatus
  createdAt: string
  authorName: string
}

/** Everything the admin console renders. */
export interface AdminData {
  overview: AdminOverview
  signups: SignupWeek[]
  members: MemberRow[]
  feedback: FeedbackRow[]
}
