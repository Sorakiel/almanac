/**
 * Database types.
 *
 * PLACEHOLDER — hand-written to mirror supabase/migrations/0001_init.sql so the
 * typed client compiles before a project is linked. Once linked, REGENERATE
 * with:
 *
 *   supabase gen types typescript --linked > src/types/database.generated.ts
 *
 * and do not hand-edit thereafter (CLAUDE.md §3).
 */

type Timestamptz = string
type DateStr = string
type UUID = string

export type UserRole = 'user' | 'admin'
export type HabitFrequency = 'daily' | 'weekly' | 'x_per_week'
export type FeedbackStatus = 'open' | 'planned' | 'done' | 'closed'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: UUID
          display_name: string | null
          avatar_url: string | null
          timezone: string
          role: UserRole
          created_at: Timestamptz
        }
        Insert: {
          id: UUID
          display_name?: string | null
          avatar_url?: string | null
          timezone?: string
          role?: UserRole
          created_at?: Timestamptz
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
        Relationships: []
      }
      habits: {
        Row: {
          id: UUID
          user_id: UUID
          name: string
          description: string | null
          icon: string | null
          color: string | null
          frequency: HabitFrequency
          target_count: number
          sort_order: number
          archived_at: Timestamptz | null
          created_at: Timestamptz
        }
        Insert: {
          id?: UUID
          user_id: UUID
          name: string
          description?: string | null
          icon?: string | null
          color?: string | null
          frequency?: HabitFrequency
          target_count?: number
          sort_order?: number
          archived_at?: Timestamptz | null
          created_at?: Timestamptz
        }
        Update: Partial<Database['public']['Tables']['habits']['Insert']>
        Relationships: []
      }
      habit_logs: {
        Row: {
          id: UUID
          user_id: UUID
          habit_id: UUID
          date: DateStr
          count: number
          note: string | null
          created_at: Timestamptz
        }
        Insert: {
          id?: UUID
          user_id: UUID
          habit_id: UUID
          date: DateStr
          count?: number
          note?: string | null
          created_at?: Timestamptz
        }
        Update: Partial<Database['public']['Tables']['habit_logs']['Insert']>
        Relationships: []
      }
      workouts: {
        Row: {
          id: UUID
          user_id: UUID
          name: string
          scheduled_date: DateStr | null
          completed_at: Timestamptz | null
          created_at: Timestamptz
        }
        Insert: {
          id?: UUID
          user_id: UUID
          name: string
          scheduled_date?: DateStr | null
          completed_at?: Timestamptz | null
          created_at?: Timestamptz
        }
        Update: Partial<Database['public']['Tables']['workouts']['Insert']>
        Relationships: []
      }
      exercises: {
        Row: {
          id: UUID
          user_id: UUID
          name: string
          muscle_group: string | null
          created_at: Timestamptz
        }
        Insert: {
          id?: UUID
          user_id: UUID
          name: string
          muscle_group?: string | null
          created_at?: Timestamptz
        }
        Update: Partial<Database['public']['Tables']['exercises']['Insert']>
        Relationships: []
      }
      workout_exercises: {
        Row: {
          id: UUID
          workout_id: UUID
          exercise_id: UUID
          target_sets: number | null
          target_reps: number | null
          target_weight: number | null
          sort_order: number
        }
        Insert: {
          id?: UUID
          workout_id: UUID
          exercise_id: UUID
          target_sets?: number | null
          target_reps?: number | null
          target_weight?: number | null
          sort_order?: number
        }
        Update: Partial<Database['public']['Tables']['workout_exercises']['Insert']>
        Relationships: []
      }
      set_logs: {
        Row: {
          id: UUID
          workout_exercise_id: UUID
          set_number: number
          reps: number | null
          weight: number | null
          done: boolean
          logged_at: Timestamptz | null
        }
        Insert: {
          id?: UUID
          workout_exercise_id: UUID
          set_number: number
          reps?: number | null
          weight?: number | null
          done?: boolean
          logged_at?: Timestamptz | null
        }
        Update: Partial<Database['public']['Tables']['set_logs']['Insert']>
        Relationships: []
      }
      quotes: {
        Row: { id: UUID; text: string; author: string | null }
        Insert: { id?: UUID; text: string; author?: string | null }
        Update: Partial<Database['public']['Tables']['quotes']['Insert']>
        Relationships: []
      }
      reflections: {
        Row: {
          id: UUID
          user_id: UUID
          date: DateStr
          body: string
          quote_id: UUID | null
          created_at: Timestamptz
        }
        Insert: {
          id?: UUID
          user_id: UUID
          date: DateStr
          body: string
          quote_id?: UUID | null
          created_at?: Timestamptz
        }
        Update: Partial<Database['public']['Tables']['reflections']['Insert']>
        Relationships: []
      }
      feedback: {
        Row: {
          id: UUID
          user_id: UUID
          body: string
          status: FeedbackStatus
          created_at: Timestamptz
        }
        Insert: {
          id?: UUID
          user_id: UUID
          body: string
          status?: FeedbackStatus
          created_at?: Timestamptz
        }
        Update: Partial<Database['public']['Tables']['feedback']['Insert']>
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: {
      is_admin: { Args: Record<never, never>; Returns: boolean }
    }
    Enums: {
      user_role: UserRole
      habit_frequency: HabitFrequency
      feedback_status: FeedbackStatus
    }
    CompositeTypes: Record<never, never>
  }
}
