import { createClient } from '@supabase/supabase-js'

// Safe Supabase client initialization for client components
export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not configured')
    return null
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}
 