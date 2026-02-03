import { NextRequest, NextResponse } from 'next/server'

// Functions backend URL
const FUNCTIONS_URL = process.env.NEXT_PUBLIC_FUNCTIONS_URL || 'https://api-5sqqk2n6ra-uc.a.run.app'

// Session configuration
const SESSION_COOKIE_NAME = 'customer_session'

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

/**
 * POST /api/auth/session
 * Create a new session via functions backend
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firebaseUid, customerId, subdomain } = body
    
    console.log('[Session API] Creating session for:', { firebaseUid, subdomain })
    
    if (!firebaseUid || !subdomain) {
      return NextResponse.json({ error: 'firebaseUid and subdomain are required' }, { status: 400 })
    }
    
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown'
    
    // Call functions backend to create session
    const backendResponse = await fetch(`${FUNCTIONS_URL}/customer/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firebaseUid, customerId, subdomain, userAgent, ipAddress })
    })
    
    if (!backendResponse.ok) {
      const error = await backendResponse.json().catch(() => ({}))
      console.error('[Session API] Backend error:', error)
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }
    
    const { sessionId, expiresAt } = await backendResponse.json()
    
    // Create response with cookie
    const response = NextResponse.json({ success: true, sessionId, expiresAt })
    
    // Set HttpOnly cookie (host-only, no Domain attribute)
    response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: new Date(expiresAt),
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
 * Verify current session via functions backend
 */
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value
    
    if (!sessionId) {
      return NextResponse.json({ authenticated: false, error: 'No session' }, { status: 401 })
    }
    
    const host = request.headers.get('host') || ''
    const subdomain = extractSubdomain(host)
    
    // Call functions backend to verify session
    const backendResponse = await fetch(`${FUNCTIONS_URL}/customer/session/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, subdomain })
    })
    
    if (!backendResponse.ok) {
      console.log('[Session API] Session invalid or expired')
      const response = NextResponse.json({ authenticated: false, error: 'Invalid session' }, { status: 401 })
      response.cookies.delete(SESSION_COOKIE_NAME)
      return response
    }
    
    const sessionData = await backendResponse.json()
    console.log('[Session API] Session verified for:', sessionData.firebaseUid)
    
    return NextResponse.json(sessionData)
    
  } catch (error) {
    console.error('[Session API] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/auth/session
 * Logout via functions backend
 */
export async function DELETE(request: NextRequest) {
  try {
    const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value
    
    if (sessionId) {
      // Call functions backend to invalidate session
      await fetch(`${FUNCTIONS_URL}/customer/session/invalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })
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
