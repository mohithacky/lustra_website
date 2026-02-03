/**
 * Authentication helper functions for API routes
 */

import { NextRequest } from 'next/server'
import { supabaseServer } from './supabase-server'

export interface SessionData {
  userId: string
  customerId: string
  firebaseUid: string
}

/**
 * Get and verify session from request cookie
 * Returns session data if valid, null otherwise
 */
export async function getSessionFromRequest(request: NextRequest): Promise<SessionData | null> {
  try {
    const sessionToken = request.cookies.get('customer_session')?.value
    
    if (!sessionToken) {
      return null
    }

    // Query session from database
    const { data: session, error } = await supabaseServer
      .from('customer_sessions')
      .select('customer_id, user_id, firebase_uid, expires_at')
      .eq('session_token', sessionToken)
      .single()

    if (error || !session) {
      return null
    }

    // Check if session is expired
    const expiresAt = new Date(session.expires_at)
    if (expiresAt < new Date()) {
      // Delete expired session
      await supabaseServer
        .from('customer_sessions')
        .delete()
        .eq('session_token', sessionToken)
      return null
    }

    return {
      userId: session.user_id,
      customerId: session.customer_id,
      firebaseUid: session.firebase_uid,
    }
  } catch (error) {
    console.error('[Auth Helper] Error verifying session:', error)
    return null
  }
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(request: NextRequest): Promise<SessionData> {
  const session = await getSessionFromRequest(request)
  
  if (!session) {
    throw new Error('Authentication required')
  }
  
  return session
}
