import { useMemo } from 'react'
import { SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseClientWithFirebaseAuth } from '@/lib/supabaseFirebaseClient'

/**
 * Hook to get a Supabase client with Firebase authentication
 * 
 * This client automatically includes the Firebase ID token in all requests.
 * Firebase manages the session, and Supabase only trusts Firebase JWTs.
 * 
 * Usage:
 * ```tsx
 * const supabase = useSupabase()
 * const { data, error } = await supabase.from('users').select('*')
 * ```
 */
export function useSupabase(): SupabaseClient {
  const supabase = useMemo(() => {
    return createSupabaseClientWithFirebaseAuth()
  }, [])

  return supabase
}
