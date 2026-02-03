import { NextRequest, NextResponse } from 'next/server'

// Functions backend URL - all operations go through this
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
 * GET /api/auth/callback
 * 
 * OAuth-style callback endpoint for cross-domain authentication
 * 
 * Query params:
 * - token: Firebase ID token from auth page
 * - returnPath: Optional path to redirect to after auth (default: /)
 * 
 * Flow:
 * 1. Receives ID token from lustrai.in/auth redirect
 * 2. Verifies token with Firebase Admin (via functions backend)
 * 3. Creates session in database
 * 4. Sets HttpOnly cookie for this subdomain
 * 5. Redirects to home page
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const idToken = searchParams.get('token')
    const returnPath = searchParams.get('returnPath') || '/'
    const isNewUser = searchParams.get('new_user') === 'true'
    const userName = searchParams.get('name')
    
    console.log('[Auth Callback] Received callback request')
    
    if (!idToken) {
      console.error('[Auth Callback] No token provided')
      return NextResponse.redirect(new URL('/?error=no_token', request.url))
    }
    
    // Get current subdomain
    const host = request.headers.get('host') || ''
    const subdomain = extractSubdomain(host)
    
    if (!subdomain) {
      console.error('[Auth Callback] Could not determine subdomain from host:', host)
      return NextResponse.redirect(new URL('/?error=invalid_subdomain', request.url))
    }
    
    console.log('[Auth Callback] Processing for subdomain:', subdomain)
    
    // Verify ID token with functions backend
    console.log('[Auth Callback] Verifying ID token with backend...')
    const verifyResponse = await fetch(`${FUNCTIONS_URL}/auth/verify-phone-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken })
    })
    
    if (!verifyResponse.ok) {
      const errorData = await verifyResponse.json().catch(() => ({}))
      console.error('[Auth Callback] Token verification failed:', errorData)
      return NextResponse.redirect(new URL('/?error=invalid_token', request.url))
    }
    
    const verifyResult = await verifyResponse.json()
    const firebaseUid = verifyResult.uid
    const phoneNumber = verifyResult.phone_number || verifyResult.phoneNumber
    
    console.log('[Auth Callback] Token verified for UID:', firebaseUid)
    
    // Get user agent and IP for session
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown'
    
    // Create session via functions backend (which also handles customer lookup/creation)
    console.log('[Auth Callback] Creating session via functions backend...')
    const sessionResponse = await fetch(`${FUNCTIONS_URL}/customer/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firebaseUid,
        subdomain,
        userAgent,
        ipAddress
      })
    })
    
    if (!sessionResponse.ok) {
      const errorData = await sessionResponse.json().catch(() => ({}))
      console.error('[Auth Callback] Session creation failed:', errorData)
      return NextResponse.redirect(new URL('/?error=session_failed', request.url))
    }
    
    const { sessionId, expiresAt } = await sessionResponse.json()
    console.log('[Auth Callback] Session created successfully')
    
    // Build redirect URL
    const redirectUrl = new URL(returnPath, request.url)
    if (isNewUser) {
      redirectUrl.searchParams.set('welcome', 'true')
    }
    
    // Create response with redirect and cookie
    const response = NextResponse.redirect(redirectUrl)
    
    // Set HttpOnly cookie for this subdomain only (host-only cookie)
    response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: new Date(expiresAt),
    })
    
    console.log('[Auth Callback] Cookie set, redirecting to:', redirectUrl.toString())
    
    return response
    
  } catch (error) {
    console.error('[Auth Callback] Unexpected error:', error)
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
  }
}
