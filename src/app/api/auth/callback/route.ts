import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, isServiceRoleConfigured } from '@/lib/supabase-server'

// Functions backend URL - for token verification only
const FUNCTIONS_URL = process.env.NEXT_PUBLIC_FUNCTIONS_URL || 'https://api-5sqqk2n6ra-uc.a.run.app'

// Session configuration
const SESSION_COOKIE_NAME = 'customer_session'
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 // 30 days in seconds

// Extract subdomain from host
function extractSubdomain(host: string): string {
  if (host.includes('localhost')) {
    return 'localhost'
  }
  const parts = host.split('.')
  if (parts.length >= 3) {
    return parts[0]
  }
  return 'default'
}

// Generate secure session token
function generateSessionToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
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
    
    if (!isServiceRoleConfigured()) {
      console.error('[Auth Callback] Service role not configured')
      return NextResponse.redirect(new URL('/?error=server_config', request.url))
    }
    
    // Get user_id from subdomain
    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .select('id')
      .eq('shop_domain', subdomain)
      .single()
    
    if (userError || !user) {
      console.error('[Auth Callback] Failed to find user for subdomain:', subdomain, userError)
      return NextResponse.redirect(new URL('/?error=shop_not_found', request.url))
    }
    
    const userId = user.id
    console.log('[Auth Callback] Found user_id:', userId)
    
    // Find or create customer
    let customerId: string
    const { data: existingCustomer, error: customerLookupError } = await supabaseServer
      .from('customers')
      .select('id')
      .eq('firebase_uid', firebaseUid)
      .eq('user_id', userId)
      .single()
    
    if (existingCustomer) {
      customerId = existingCustomer.id
      console.log('[Auth Callback] Found existing customer:', customerId)
    } else {
      // Create new customer
      const { data: newCustomer, error: createError } = await supabaseServer
        .from('customers')
        .insert({
          firebase_uid: firebaseUid,
          user_id: userId,
          phone_number: phoneNumber,
          name: userName || null,
        })
        .select('id')
        .single()
      
      if (createError || !newCustomer) {
        console.error('[Auth Callback] Failed to create customer:', createError)
        return NextResponse.redirect(new URL('/?error=customer_creation_failed', request.url))
      }
      
      customerId = newCustomer.id
      console.log('[Auth Callback] Created new customer:', customerId)
    }
    
    // Get user agent and IP for session
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown'
    
    // Create session locally
    console.log('[Auth Callback] Creating local session...')
    const sessionToken = generateSessionToken()
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000)
    
    const { error: sessionError } = await supabaseServer
      .from('customer_sessions')
      .insert({
        session_id: sessionToken,
        customer_id: customerId,
        firebase_uid: firebaseUid,
        tenant_subdomain: subdomain,
        expires_at: expiresAt.toISOString(),
        user_agent: userAgent,
        ip_address: ipAddress,
        is_active: true,
      })
    
    if (sessionError) {
      console.error('[Auth Callback] Session creation failed:', sessionError)
      return NextResponse.redirect(new URL('/?error=session_failed', request.url))
    }
    
    console.log('[Auth Callback] Session created successfully')
    
    // Build redirect URL
    const redirectUrl = new URL(returnPath, request.url)
    if (isNewUser) {
      redirectUrl.searchParams.set('welcome', 'true')
    }
    
    // Create response with redirect and cookie
    const response = NextResponse.redirect(redirectUrl)
    
    // Set HttpOnly cookie for this subdomain only (host-only cookie)
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    })
    
    console.log('[Auth Callback] Cookie set, redirecting to:', redirectUrl.toString())
    
    return response
    
  } catch (error) {
    console.error('[Auth Callback] Unexpected error:', error)
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
  }
}
