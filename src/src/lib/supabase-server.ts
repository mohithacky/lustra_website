/**
 * Supabase Server Client with Service Role
 * 
 * This client bypasses RLS policies and should ONLY be used in server-side API routes.
 * Never expose the service role key to the client.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://phlccyxgyftspxnuzttf.supabase.co'
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceRoleKey) {
  console.warn('[SUPABASE SERVER] SUPABASE_SERVICE_ROLE_KEY is not set. Server-side operations will fail.')
}

export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey || '', {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

/**
 * Check if service role client is properly configured
 */
export function isServiceRoleConfigured(): boolean {
  return Boolean(supabaseServiceRoleKey)
}
