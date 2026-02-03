/**
 * Session management utilities for server-side authentication
 */

import { cookies } from 'next/headers'
import { supabaseServer } from './supabase-server'

const SESSION_COOKIE_NAME = 'customer_session'
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 // 30 days in seconds

export interface SessionData {
  customerId: string
  userId: string // shop owner's user_id
  firebaseUid: string
  createdAt: number
}

/**
 * Get the current session from cookie
 */
export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)
    
    if (!sessionCookie?.value) {
      return null
    }

    // Query the customer_sessions table to validate the session
    const { data: session, error } = await supabaseServer
      .from('customer_sessions')
      .select('customer_id, user_id, firebase_uid, created_at, expires_at')
      .eq('session_token', sessionCookie.value)
      .single()

    if (error || !session) {
      console.error('[Session] Invalid session:', error)
      return null
    }

    // Check if session is expired
    const expiresAt = new Date(session.expires_at)
    if (expiresAt < new Date()) {
      console.log('[Session] Session expired')
      await deleteSession(sessionCookie.value)
      return null
    }

    return {
      customerId: session.customer_id,
      userId: session.user_id,
      firebaseUid: session.firebase_uid,
      createdAt: new Date(session.created_at).getTime(),
    }
  } catch (error) {
    console.error('[Session] Error getting session:', error)
    return null
  }
}

/**
 * Create a new session for a customer
 */
export async function createSession(
  customerId: string,
  userId: string,
  firebaseUid: string
): Promise<string | null> {
  try {
    // Generate a secure random session token
    const sessionToken = generateSessionToken()
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000)

    // Store session in database
    const { error } = await supabaseServer
      .from('customer_sessions')
      .insert({
        session_token: sessionToken,
        customer_id: customerId,
        user_id: userId,
        firebase_uid: firebaseUid,
        expires_at: expiresAt.toISOString(),
      })

    if (error) {
      console.error('[Session] Error creating session:', error)
      return null
    }

    // Set HTTP-only cookie
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    })

    return sessionToken
  } catch (error) {
    console.error('[Session] Error creating session:', error)
    return null
  }
}

/**
 * Delete a session
 */
export async function deleteSession(sessionToken?: string): Promise<void> {
  try {
    const cookieStore = await cookies()
    const token = sessionToken || cookieStore.get(SESSION_COOKIE_NAME)?.value

    if (token) {
      // Delete from database
      await supabaseServer
        .from('customer_sessions')
        .delete()
        .eq('session_token', token)
    }

    // Clear cookie
    cookieStore.delete(SESSION_COOKIE_NAME)
  } catch (error) {
    console.error('[Session] Error deleting session:', error)
  }
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(): Promise<SessionData> {
  const session = await getSession()
  
  if (!session) {
    throw new Error('Authentication required')
  }
  
  return session
}

/**
 * Generate a secure random session token
 */
function generateSessionToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}
