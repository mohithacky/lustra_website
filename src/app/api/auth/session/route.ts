import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, isServiceRoleConfigured } from '@/lib/supabase-server'

// Session configuration
const SESSION_COOKIE_NAME = 'customer_session'
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 // 30 days in seconds

// Extract subdomain from host
function extractSubdomain(host: string): string | null {
  if (host.includes('localhost')) {
    return 'localhost'
  }
  const parts = host.split('.')
  if (parts.length >= 3) {
    return parts[0]
  }
  return null
}

// Generate secure session token
function generateSessionToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * POST /api/auth/session
 * Create a new session using Supabase service role
 */
export async function POST(request: NextRequest) {
  try {
    if (!isServiceRoleConfigured()) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { firebaseUid, customerId, userId } = body
    
    console.log('[Session API] Creating session for:', { firebaseUid, customerId, userId })
    
    if (!firebaseUid || !customerId || !userId) {
      return NextResponse.json({ error: 'firebaseUid, customerId, and userId are required' }, { status: 400 })
    }
    
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown'
    
    // Generate session token
    const sessionToken = generateSessionToken()
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000)
    
    // Store session in database
    const { error: insertError } = await supabaseServer
      .from('customer_sessions')
      .insert({
        session_token: sessionToken,
        customer_id: customerId,
        user_id: userId,
        firebase_uid: firebaseUid,
        expires_at: expiresAt.toISOString(),
        user_agent: userAgent,
        ip_address: ipAddress,
      })
    
    if (insertError) {
      console.error('[Session API] Database error:', insertError)
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }
    
    // Create response with cookie
    const response = NextResponse.json({ 
      success: true, 
      sessionId: sessionToken, 
      expiresAt: expiresAt.toISOString() 
    })
    
    // Set HttpOnly cookie
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    })
    
    console.log('[Session API] Session created successfully')
    return response
    
  } catch (error) {
    console.error('[Session API] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/auth/session
 * Verify current session using Supabase
 */
export async function GET(request: NextRequest) {
  try {
    if (!isServiceRoleConfigured()) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value
    
    if (!sessionToken) {
      return NextResponse.json({ authenticated: false, error: 'No session' }, { status: 401 })
    }
    
    // Query session from database
    const { data: session, error } = await supabaseServer
      .from('customer_sessions')
      .select('customer_id, user_id, firebase_uid, created_at, expires_at')
      .eq('session_token', sessionToken)
      .single()
    
    if (error || !session) {
      console.log('[Session API] Session not found or invalid')
      const response = NextResponse.json({ authenticated: false, error: 'Invalid session' }, { status: 401 })
      response.cookies.delete(SESSION_COOKIE_NAME)
      return response
    }
    
    // Check if session is expired
    const expiresAt = new Date(session.expires_at)
    if (expiresAt < new Date()) {
      console.log('[Session API] Session expired')
      // Delete expired session
      await supabaseServer
        .from('customer_sessions')
        .delete()
        .eq('session_token', sessionToken)
      
      const response = NextResponse.json({ authenticated: false, error: 'Session expired' }, { status: 401 })
      response.cookies.delete(SESSION_COOKIE_NAME)
      return response
    }
    
    console.log('[Session API] Session verified for customer:', session.customer_id)
    
    return NextResponse.json({
      authenticated: true,
      customerId: session.customer_id,
      userId: session.user_id,
      firebaseUid: session.firebase_uid,
    })
    
  } catch (error) {
    console.error('[Session API] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/auth/session
 * Logout - delete session from database
 */
export async function DELETE(request: NextRequest) {
  try {
    if (!isServiceRoleConfigured()) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value
    
    if (sessionToken) {
      // Delete session from database
      await supabaseServer
        .from('customer_sessions')
        .delete()
        .eq('session_token', sessionToken)
      
      console.log('[Session API] Session deleted')
    }
    
    // Clear cookie
    const response = NextResponse.json({ success: true, message: 'Logged out' })
    response.cookies.delete(SESSION_COOKIE_NAME)
    
    return response
    
  } catch (error) {
    console.error('[Session API] Logout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
