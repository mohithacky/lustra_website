import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

// Initialize Supabase client with service role for session management
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey)
}

// Session configuration
const SESSION_DURATION_DAYS = 30
const SESSION_COOKIE_NAME = 'customer_session'

// Generate a cryptographically secure session ID
function generateSessionId(): string {
  return randomBytes(32).toString('hex')
}

// Extract subdomain from host
function extractSubdomain(host: string): string | null {
  // Handle localhost for development
  if (host.includes('localhost')) {
    return 'localhost'
  }
  
  // Extract subdomain from host like "ashmitjewellers.lustrai.in"
  const parts = host.split('.')
  if (parts.length >= 3) {
    return parts[0] // Returns "ashmitjewellers"
  }
  return null
}

/**
 * POST /api/auth/session
 * Create a new session after Firebase authentication
 * 
 * Request body:
 * - firebaseUid: string (verified Firebase user ID)
 * - customerId: number (optional, customer ID from database)
 * - subdomain: string (the tenant subdomain to create session for)
 * 
 * Response:
 * - Sets HttpOnly cookie for the subdomain
 * - Returns session info
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firebaseUid, customerId, subdomain } = body
    
    console.log('[Session API] Creating session for:', { firebaseUid, subdomain })
    
    if (!firebaseUid) {
      return NextResponse.json({ error: 'Firebase UID is required' }, { status: 400 })
    }
    
    if (!subdomain) {
      return NextResponse.json({ error: 'Subdomain is required' }, { status: 400 })
    }
    
    const supabase = getSupabaseAdmin()
    
    // Generate session ID and expiry
    const sessionId = generateSessionId()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS)
    
    // Get user agent and IP for security logging
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown'
    
    // Store session in database
    const { data: session, error } = await supabase
      .from('customer_sessions')
      .insert({
        session_id: sessionId,
        firebase_uid: firebaseUid,
        customer_id: customerId || null,
        tenant_subdomain: subdomain,
        user_agent: userAgent,
        ip_address: ipAddress,
        expires_at: expiresAt.toISOString(),
        is_active: true
      })
      .select()
      .single()
    
    if (error) {
      console.error('[Session API] Error creating session:', error)
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }
    
    console.log('[Session API] Session created:', session.id)
    
    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      sessionId: session.id,
      expiresAt: expiresAt.toISOString()
    })
    
    // Set HttpOnly cookie
    // The cookie is host-only (no Domain attribute) so it only applies to the specific subdomain
    response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
      // NOT setting domain makes it host-only (exact subdomain match)
    })
    
    console.log('[Session API] Cookie set for subdomain:', subdomain)
    
    return response
    
  } catch (error) {
    console.error('[Session API] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/auth/session
 * Verify current session and return customer data
 * 
 * Reads session cookie and validates against database
 */
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value
    
    if (!sessionId) {
      return NextResponse.json({ authenticated: false, error: 'No session' }, { status: 401 })
    }
    
    const supabase = getSupabaseAdmin()
    
    // Get session from database
    const { data: session, error } = await supabase
      .from('customer_sessions')
      .select(`
        *,
        customer:customers(*)
      `)
      .eq('session_id', sessionId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single()
    
    if (error || !session) {
      console.log('[Session API] Session not found or expired')
      
      // Clear invalid cookie
      const response = NextResponse.json({ authenticated: false, error: 'Invalid session' }, { status: 401 })
      response.cookies.delete(SESSION_COOKIE_NAME)
      return response
    }
    
    // Verify subdomain matches
    const host = request.headers.get('host') || ''
    const currentSubdomain = extractSubdomain(host)
    
    if (currentSubdomain && session.tenant_subdomain !== currentSubdomain && currentSubdomain !== 'localhost') {
      console.log('[Session API] Subdomain mismatch:', { expected: session.tenant_subdomain, got: currentSubdomain })
      return NextResponse.json({ authenticated: false, error: 'Session subdomain mismatch' }, { status: 401 })
    }
    
    // Update last accessed timestamp
    await supabase
      .from('customer_sessions')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('session_id', sessionId)
    
    console.log('[Session API] Session verified for:', session.firebase_uid)
    
    return NextResponse.json({
      authenticated: true,
      firebaseUid: session.firebase_uid,
      customerId: session.customer_id,
      subdomain: session.tenant_subdomain,
      customer: session.customer,
      expiresAt: session.expires_at
    })
    
  } catch (error) {
    console.error('[Session API] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/auth/session
 * Logout - invalidate session and clear cookie
 */
export async function DELETE(request: NextRequest) {
  try {
    const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value
    
    if (sessionId) {
      const supabase = getSupabaseAdmin()
      
      // Deactivate session in database
      await supabase
        .from('customer_sessions')
        .update({ is_active: false })
        .eq('session_id', sessionId)
      
      console.log('[Session API] Session invalidated')
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
