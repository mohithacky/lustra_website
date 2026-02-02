import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getFirebaseAuth } from './firebase';

// Supabase configuration (using the same credentials from your Flutter app)
const SUPABASE_URL = 'https://phlccyxgyftspxnuzttf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_tMc-l2KRHyKOXlR0tODIPw_VhBH-w5R';

/**
 * Create a Supabase client with dynamic Firebase token retrieval
 */
export function createSupabaseClientWithFirebaseAuth(): SupabaseClient {
  console.log('Creating Supabase client with dynamic Firebase token retrieval...');
  
  const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        apikey: SUPABASE_ANON_KEY
      },
      fetch: async (url, options = {}) => {
        const auth = getFirebaseAuth();
        const user = auth?.currentUser;
        
        // Start with a fresh headers object
        const headers = new Headers();
        
        // Always add the apikey header
        headers.set('apikey', SUPABASE_ANON_KEY);
        headers.set('Content-Type', 'application/json');
        
        // Copy existing headers if any
        if (options.headers) {
          const existingHeaders = options.headers instanceof Headers 
            ? options.headers 
            : new Headers(options.headers as any);
          
          existingHeaders.forEach((value, key) => {
            if (key.toLowerCase() !== 'apikey') {  // Don't duplicate apikey
              headers.set(key, value);
            }
          });
        }
        
        // Add Firebase token if user is authenticated
        if (user) {
          try {
            console.log('Getting Firebase ID token...');
            const token = await user.getIdToken();
            console.log('Firebase ID token obtained');
            
            headers.set('Authorization', `Bearer ${token}`);
            
            // Log token info for debugging
            try {
              const tokenParts = token.split('.');
              if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1].replace(/-/g, '+').replace(/_/g, '/')));
                console.log('Token claims:', {
                  sub: payload.sub,
                  role: payload.role || 'NOT SET'
                });
              }
            } catch (e) {
              console.error('Could not parse token payload:', e);
            }
          } catch (error) {
            console.error('[Supabase] Error getting Firebase token:', error);
          }
        }
        
        // Create new options with our headers
        const newOptions = {
          ...options,
          headers
        };
        
        return fetch(url, newOptions);
      }
    }
  });
  
  console.log('Supabase client created successfully');
  return supabaseClient;
}

/**
 * Create a Supabase client with static Firebase ID token
 */
export function createSupabaseClientWithFirebaseToken(
  firebaseIdToken: string
): SupabaseClient {
  console.log('Creating Supabase client with static Firebase token...');
  
  // Try to decode token payload to log claims
  try {
    const tokenParts = firebaseIdToken.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(atob(tokenParts[1].replace(/-/g, '+').replace(/_/g, '/')));
      console.log('Token claims:', {
        sub: payload.sub,
        role: payload.role || 'NOT SET',
        exp: new Date(payload.exp * 1000).toISOString()
      });
    }
  } catch (e) {
    console.error('Could not parse token payload:', e);
  }
  
  // Create client with Firebase token and apikey headers
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        apikey: SUPABASE_ANON_KEY
      },
      fetch: async (url, options = {}) => {
        // Start with a fresh headers object
        const headers = new Headers();
        
        // Always add the apikey header
        headers.set('apikey', SUPABASE_ANON_KEY);
        headers.set('Content-Type', 'application/json');
        headers.set('Authorization', `Bearer ${firebaseIdToken}`);
        
        // Copy existing headers if any
        if (options.headers) {
          const existingHeaders = options.headers instanceof Headers 
            ? options.headers 
            : new Headers(options.headers as any);
          
          existingHeaders.forEach((value, key) => {
            if (!['apikey', 'authorization'].includes(key.toLowerCase())) {
              headers.set(key, value);
            }
          });
        }
        
        // Create new options with our headers
        const newOptions = {
          ...options,
          headers
        };
        
        return fetch(url, newOptions);
      }
    }
  });
  
  console.log('Supabase client created successfully with static Firebase token');
  return client;
}

/**
 * Get a standard Supabase client (without Firebase token)
 */
export function getSupabaseClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
