/**
 * Supabase Client with Firebase Token Integration
 * 
 * This creates a Supabase client that uses Firebase ID token for authentication,
 * matching the Flutter app's implementation.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://phlccyxgyftspxnuzttf.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobGNjeXhneWZ0c3B4bnV6dHRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0NTc4MTIsImV4cCI6MjA1MTAzMzgxMn0.vYZ_OPuJOGJXqNuYvyPMqgp9F-oPqJxCeJRqwRhLJqk'

/**
 * Create a Supabase client with Firebase ID token as the authorization header
 * 
 * This is the same approach used in the Flutter app:
 * - Uses Firebase ID token (with custom 'role: authenticated' claim) as Bearer token
 * - Supabase RLS policies accept this token for authentication
 * - The token is verified by Supabase using the Firebase JWT secret
 */
export function createSupabaseClientWithFirebaseToken(
  firebaseIdToken: string
): SupabaseClient {
  console.log('[Supabase] Creating client with Firebase ID token')
  
  const supabaseClient = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${firebaseIdToken}`
        }
      },
      auth: {
        persistSession: false, // Don't persist Supabase session since we're using Firebase
        autoRefreshToken: false
      }
    }
  )
  
  console.log('[Supabase] Client created successfully with Firebase token')
  return supabaseClient
}

/**
 * Get a standard Supabase client (without Firebase token)
 * Use this for public access or when you have a Supabase session
 */
export function getSupabaseClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
