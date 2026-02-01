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
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_tMc-l2KRHyKOXlR0tODIPw_VhBH-w5R'

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
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        fetch: async (url, options = {}) => {
          const auth = getFirebaseAuth()
          const user = auth?.currentUser
          
          // Build headers as plain object for maximum compatibility
          const headers: Record<string, string> = {
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
          };
          
          // Copy existing headers if any
          if (options.headers) {
            if (options.headers instanceof Headers) {
              options.headers.forEach((value, key) => {
                if (key.toLowerCase() !== 'apikey') {
                  headers[key] = value;
                }
              });
            } else if (typeof options.headers === 'object') {
              Object.entries(options.headers as Record<string, string>).forEach(([key, value]) => {
                if (key.toLowerCase() !== 'apikey') {
                  headers[key] = value;
                }
              });
            }
          }

          if (user) {
            try {
              const token = await user.getIdToken()
              headers['Authorization'] = `Bearer ${token}`;
            } catch (error) {
              console.error('[Supabase] Error getting Firebase token:', error)
            }
          }
          
          console.log('[Supabase] Request URL:', url);
          console.log('[Supabase] Request headers:', { ...headers, Authorization: headers.Authorization ? 'Bearer [TOKEN]' : undefined });
          
          return fetch(url, { ...options, headers })
        }
      }
    }
  )
  
  console.log('[Supabase] Supabase client created successfully with dynamic Firebase token')
  return supabaseClient
}

/**
 * Legacy: Create a Supabase client with static Firebase ID token
 * Use createSupabaseClientWithFirebaseAuth() instead for dynamic token retrieval
 */
export function createSupabaseClientWithFirebaseToken(
  firebaseIdToken: string
): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('[Supabase] Missing Supabase URL or anon key in environment variables')
    throw new Error('Supabase URL and anon key are required')
  }
  
  console.log('[Supabase] Creating Supabase client with static Firebase token')
  
  // Extract token payload to log claims and verify role
  try {
    const tokenParts = firebaseIdToken.split('.')
    if (tokenParts.length === 3) {
      const payload = JSON.parse(atob(tokenParts[1].replace(/-/g, '+').replace(/_/g, '/')))
      console.log('[Supabase] Token claims:', {
        sub: payload.sub,
        role: payload.role || 'NOT SET',
        exp: new Date(payload.exp * 1000).toISOString()
      })
      
      if (!payload.role) {
        console.warn('[Supabase] WARNING: Token does not have a role claim. RLS policies may fail!')
      } else if (payload.role === 'authenticated') {
        console.log('[Supabase] ✅ Role claim is properly set to "authenticated"')
      }
    }
  } catch (e) {
    console.error('[Supabase] Could not parse token payload:', e)
  }
  
  // Create client with Firebase token and apikey headers
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,  // Don't persist the Supabase session
      autoRefreshToken: false, // Don't refresh the token - Firebase handles this
      detectSessionInUrl: false, // Don't detect session in URL - this is handled by Firebase
    },
    global: {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      fetch: async (url, options = {}) => {
        // Build headers as plain object for maximum compatibility
        const headers: Record<string, string> = {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firebaseIdToken}`
        };
        
        // Copy existing headers if any
        if (options.headers) {
          if (options.headers instanceof Headers) {
            options.headers.forEach((value, key) => {
              if (!['apikey', 'authorization'].includes(key.toLowerCase())) {
                headers[key] = value;
              }
            });
          } else if (typeof options.headers === 'object') {
            Object.entries(options.headers as Record<string, string>).forEach(([key, value]) => {
              if (!['apikey', 'authorization'].includes(key.toLowerCase())) {
                headers[key] = value;
              }
            });
          }
        }
        
        console.log('[Supabase] Request URL:', url);
        console.log('[Supabase] Request headers:', { ...headers, Authorization: 'Bearer [TOKEN]' });
        
        return fetch(url, { ...options, headers })
      }
    }
  })
  
  console.log('[Supabase] Supabase client created successfully with static Firebase token')
  return client
}

/**
 * Get a standard Supabase client (without Firebase token)
 * Use this for public access only
 */
export function getSupabaseClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        'apikey': SUPABASE_ANON_KEY
      }
    }
  })
}
