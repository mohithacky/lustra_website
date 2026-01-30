/**
 * Supabase Client with Firebase Token Integration
 * 
 * This creates a Supabase client that uses Firebase ID token for authentication,
 * matching the Flutter app's implementation.
 * 
 * ARCHITECTURE:
 * - Firebase owns the session (manages auth state, token refresh)
 * - Supabase only trusts Firebase JWTs for RLS-protected access
 * - No Supabase session is created
 * - Firebase ID token is retrieved dynamically on each request
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getFirebaseAuth } from './firebase'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://phlccyxgyftspxnuzttf.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobGNjeXhneWZ0c3B4bnV6dHRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0NTc4MTIsImV4cCI6MjA1MTAzMzgxMn0.vYZ_OPuJOGJXqNuYvyPMqgp9F-oPqJxCeJRqwRhLJqk'

/**
 * Create a Supabase client with dynamic Firebase token retrieval
 * 
 * FLOW:
 * 1. Whenever DB access is needed, call firebase.auth().currentUser.getIdToken()
 * 2. Firebase returns a Firebase ID token (JWT) with:
 *    - sub = firebase_uid
 *    - custom claim: role = authenticated
 * 3. Supabase receives requests with: Authorization: Bearer <firebase_id_token>
 * 4. Supabase verifies the Firebase JWT signature
 * 5. RLS policies use auth.jwt() to read Firebase claims
 * 6. RLS enforces row access using firebase_uid
 * 7. Database returns only authorized rows
 * 
 * RULES:
 * - Firebase owns the session
 * - Supabase only trusts Firebase JWTs
 * - Do NOT use Supabase service role in browser
 * - Do NOT store Firebase ID token long-term
 */
export function createSupabaseClientWithFirebaseAuth(): SupabaseClient {
  const supabaseClient = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      },
      global: {
        fetch: async (url, options = {}) => {
          const auth = getFirebaseAuth()
          const user = auth?.currentUser
          
          if (user) {
            try {
              const token = await user.getIdToken()
              options.headers = {
                ...options.headers,
                Authorization: `Bearer ${token}`
              }
            } catch (error) {
              console.error('[Supabase] Error getting Firebase token:', error)
            }
          }
          
          return fetch(url, options)
        }
      }
    }
  )
  
  return supabaseClient
}

/**
 * Legacy: Create a Supabase client with static Firebase ID token
 * Use createSupabaseClientWithFirebaseAuth() instead for dynamic token retrieval
 */
export function createSupabaseClientWithFirebaseToken(
  firebaseIdToken: string
): SupabaseClient {
  console.log('[Supabase] Creating client with static Firebase ID token')
  
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
        persistSession: false,
        autoRefreshToken: false
      }
    }
  )
  
  console.log('[Supabase] Client created successfully with Firebase token')
  return supabaseClient
}

/**
 * Get a standard Supabase client (without Firebase token)
 * Use this for public access only
 */
export function getSupabaseClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
