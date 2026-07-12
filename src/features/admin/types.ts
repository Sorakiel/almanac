import type { Database } from '@/types/database.generated'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Feedback = Database['public']['Tables']['feedback']['Row']
export type FeedbackStatus = Database['public']['Enums']['feedback_status']
export type UserRole = Database['public']['Enums']['user_role']

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
  role: UserRole
  joinedAt: string
}

/** One habit in a user's detail view (admin/owner cross-user read). */
export interface UserHabitRow {
  id: string
  name: string
  frequencyLabel: string
  /** Completed calendar days over the last 30 days. */
  doneLast30: number
}

/** A user's detail read-out for the admin console. */
export interface AdminUserDetail {
  id: string
  name: string
  role: UserRole
  joinedAt: string
  timezone: string | null
  stats: {
    habits: number
    logs: number
    /** Completion over the last 30 days across daily-ish habits, 0–100. */
    completionPct: number
    /** Distinct days with at least one completed log in the last 30. */
    activeDays30: number
  }
  habits: UserHabitRow[]
  feedback: FeedbackRow[]
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
