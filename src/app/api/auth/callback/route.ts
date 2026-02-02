import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

// Initialize Supabase client with service role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const functionsBackendUrl = process.env.NEXT_PUBLIC_FUNCTIONS_URL || 'https://api-5sqqk2n6ra-uc.a.run.app'

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
    const verifyResponse = await fetch(`${functionsBackendUrl}/auth/verify-phone-token`, {
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
    
    // Get or create customer in database
    const supabase = getSupabaseAdmin()
    
    let customer = null
    const { data: existingCustomer, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .eq('firebase_uid', firebaseUid)
      .maybeSingle()
    
    if (fetchError) {
      console.error('[Auth Callback] Error fetching customer:', fetchError)
    }
    
    if (existingCustomer) {
      customer = existingCustomer
      console.log('[Auth Callback] Found existing customer:', customer.id)
    } else if (isNewUser) {
      // Create new customer
      console.log('[Auth Callback] Creating new customer...')
      const { data: newCustomer, error: insertError } = await supabase
        .from('customers')
        .insert({
          firebase_uid: firebaseUid,
          phone_number: phoneNumber,
          name: userName ? decodeURIComponent(userName) : null,
          user_id: 'default', // Will be updated based on shop
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (insertError) {
        console.error('[Auth Callback] Error creating customer:', insertError)
      } else {
        customer = newCustomer
        console.log('[Auth Callback] Created customer:', customer.id)
      }
    }
    
    // Generate session
    const sessionId = generateSessionId()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS)
    
    // Get user agent and IP
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown'
    
    // Store session in database
    const { data: session, error: sessionError } = await supabase
      .from('customer_sessions')
      .insert({
        session_id: sessionId,
        firebase_uid: firebaseUid,
        customer_id: customer?.id || null,
        tenant_subdomain: subdomain,
        user_agent: userAgent,
        ip_address: ipAddress,
        expires_at: expiresAt.toISOString(),
        is_active: true
      })
      .select()
      .single()
    
    if (sessionError) {
      console.error('[Auth Callback] Error creating session:', sessionError)
      return NextResponse.redirect(new URL('/?error=session_failed', request.url))
    }
    
    console.log('[Auth Callback] Session created:', session.id)
    
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
      expires: expiresAt,
      // NOT setting domain makes it host-only (exact subdomain match)
    })
    
    console.log('[Auth Callback] Cookie set, redirecting to:', redirectUrl.toString())
    
    return response
    
  } catch (error) {
    console.error('[Auth Callback] Unexpected error:', error)
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
  }
}
