import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.generated'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Copy .env.example to .env.local and set ' +
      'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
  )
}

const REMEMBER_FLAG = 'almanac.remember'

/**
 * "Remember me" support: supabase-js still owns the session — we only choose
 * which bucket it persists to. Opting out routes tokens to sessionStorage, so
 * the session ends when the browser closes. Set BEFORE signing in.
 */
export function setRememberMe(remember: boolean): void {
  localStorage.setItem(REMEMBER_FLAG, remember ? '1' : '0')
}

const remembered = (): boolean => localStorage.getItem(REMEMBER_FLAG) !== '0'

const authStorage = {
  getItem: (key: string): string | null => sessionStorage.getItem(key) ?? localStorage.getItem(key),
  setItem: (key: string, value: string): void => {
    if (remembered()) localStorage.setItem(key, value)
    else sessionStorage.setItem(key, value)
  },
  removeItem: (key: string): void => {
    sessionStorage.removeItem(key)
    localStorage.removeItem(key)
  },
}

/**
 * Single browser Supabase client. The anon key is safe on the client because
 * Row-Level Security enforces per-user isolation at the database. supabase-js
 * owns session/token persistence — never hand-manage tokens.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: authStorage,
  },
})
