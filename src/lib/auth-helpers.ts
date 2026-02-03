/**
 * Authentication helper functions for API routes
 */

import { NextRequest } from 'next/server'
import { supabaseServer } from './supabase-server'

export interface SessionData {
  customerId: string
  firebaseUid: string
  tenantSubdomain: string
  userId?: string // Shop owner's user ID (fetched from subdomain)
}

/**
 * Get userId (shop owner ID) from subdomain
 */
async function getUserIdFromSubdomain(subdomain: string): Promise<string | null> {
  try {
    if (subdomain === 'localhost' || subdomain === 'default') {
      // For localhost, we might need to handle differently
      // For now, return null and let the API handle it
      return null
    }

    // Query users table to find the shop owner by subdomain
    const { data: user, error } = await supabaseServer
      .from('users')
      .select('id')
      .eq('subdomain', subdomain)
      .single()

    if (error || !user) {
      console.error('[Auth Helper] Failed to get userId from subdomain:', subdomain, error)
      return null
    }

    return user.id
  } catch (error) {
    console.error('[Auth Helper] Error getting userId from subdomain:', error)
    return null
  }
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
      .select('customer_id, firebase_uid, tenant_subdomain, expires_at, is_active')
      .eq('session_id', sessionToken)
      .eq('is_active', true)
      .single()

    if (error || !session) {
      return null
    }

    // Check if session is expired
    const expiresAt = new Date(session.expires_at)
    if (expiresAt < new Date()) {
      // Mark expired session as inactive
      await supabaseServer
        .from('customer_sessions')
        .update({ is_active: false })
        .eq('session_id', sessionToken)
      return null
    }

    // Get userId from subdomain
    const userId = await getUserIdFromSubdomain(session.tenant_subdomain)

    return {
      customerId: session.customer_id,
      firebaseUid: session.firebase_uid,
      tenantSubdomain: session.tenant_subdomain,
      userId: userId || undefined,
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
