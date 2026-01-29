/**
 * Firebase Phone Authentication Service for Next.js Website
 * 
 * This implements the same Firebase phone auth flow as the Flutter app:
 * 1. Send OTP via Firebase
 * 2. Verify OTP and get Firebase user
 * 3. Get Firebase ID token
 * 4. Send to backend to add custom claims
 * 5. Refresh token to get updated claims
 * 6. Create Supabase client with Firebase token
 */

import { 
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  User as FirebaseUser
} from 'firebase/auth'
import { getFirebaseAuth } from './firebase'
import { createSupabaseClientWithFirebaseToken } from './supabaseFirebaseClient'

const BACKEND_URL = 'https://api-5sqqk2n6ra-uc.a.run.app'

export interface FirebaseAuthResult {
  firebaseUser: FirebaseUser
  idToken: string
  isNewUser: boolean
  shopDetailsFilled: boolean
  userId: string
  phoneNumber: string
}

/**
 * Initialize reCAPTCHA verifier for phone auth
 * This is required by Firebase for web phone authentication
 */
export function initializeRecaptcha(containerId: string): RecaptchaVerifier {
  const auth = getFirebaseAuth()
  
  const recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      console.log('[Firebase] reCAPTCHA verified')
    },
    'expired-callback': () => {
      console.log('[Firebase] reCAPTCHA expired')
    }
  })
  
  return recaptchaVerifier
}

/**
 * Send OTP to phone number using Firebase
 * Returns a confirmation result that can be used to verify the OTP
 */
export async function sendFirebaseOtp(
  phoneNumber: string,
  recaptchaVerifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  try {
    console.log('[Firebase] Sending OTP to:', phoneNumber)
    const auth = getFirebaseAuth()
    
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      recaptchaVerifier
    )
    
    console.log('[Firebase] OTP sent successfully')
    return confirmationResult
  } catch (error) {
    console.error('[Firebase] Error sending OTP:', error)
    throw error
  }
}

/**
 * Verify OTP and complete Firebase phone authentication
 * This follows the exact same flow as the Flutter app
 */
export async function verifyFirebaseOtp(
  confirmationResult: ConfirmationResult,
  otp: string
): Promise<FirebaseAuthResult> {
  try {
    console.log('')
    console.log('╔════════════════════════════════════════════════════════════════╗')
    console.log('║  FIREBASE PHONE AUTH - AUTHENTICATION FLOW STARTED            ║')
    console.log('╚════════════════════════════════════════════════════════════════╝')
    console.log('')

    // STEP 1: Sign in to Firebase with OTP
    console.log('📱 [STEP 1/7] Verifying OTP with Firebase...')
    const userCredential = await confirmationResult.confirm(otp)
    const user = userCredential.user
    console.log('✅ [STEP 1/7] Firebase sign-in completed successfully')
    console.log('   • User ID:', user.uid)
    console.log('   • Phone:', user.phoneNumber)

    // STEP 2: Get Firebase ID token
    console.log('')
    console.log('🔑 [STEP 2/7] Obtaining Firebase ID token...')
    const idToken = await user.getIdToken()
    console.log('✅ [STEP 2/7] Firebase ID token obtained:', idToken.substring(0, 20) + '...')

    // STEP 3: Send token to backend for verification and custom claim addition
    console.log('')
    console.log('🔐 [STEP 3/7] Sending token to backend for verification...')
    const backendResponse = await verifyTokenAndAddClaim(idToken)
    const isNewUser = backendResponse.isNewUser || false
    console.log('✅ [STEP 3/7] Backend verification complete')
    console.log('   • User status:', isNewUser ? 'NEW USER' : 'EXISTING USER')

    // STEP 4: Force refresh token to get updated claims
    console.log('')
    console.log('🔄 [STEP 4/7] Refreshing Firebase token to get updated claims...')
    await user.getIdToken(true) // Force refresh
    const updatedIdToken = await user.getIdToken()
    console.log('✅ [STEP 4/7] Token refreshed:', updatedIdToken.substring(0, 20) + '...')

    // Print token details
    console.log('')
    console.log('📋 Token Details:')
    printTokenDetails(updatedIdToken)

    // STEP 5: Create Supabase client with Firebase token
    console.log('')
    console.log('🗄️  [STEP 5/7] Creating Supabase client with Firebase token...')
    const supabaseClient = createSupabaseClientWithFirebaseToken(updatedIdToken)
    console.log('✅ [STEP 5/7] Supabase client created')

    // STEP 6: Verify Supabase authentication
    console.log('')
    console.log('🔍 [STEP 6/7] Verifying Supabase authentication...')
    console.log('   • Attempting to access users table with Firebase UID:', user.uid)
    const authVerified = await verifySupabaseAuthentication(supabaseClient, user.uid)
    console.log('   • Verification result:', authVerified ? '✅ SUCCESS' : '❌ FAILED')

    if (!authVerified) {
      console.error('❌ Supabase authentication failed')
      throw new Error('Failed to authenticate with Supabase using Firebase token')
    }

    // STEP 7: Fetch user data from Supabase
    console.log('')
    console.log('📊 [STEP 7/7] Fetching user data from Supabase users table...')
    const { data: userResponse, error } = await supabaseClient
      .from('users')
      .select()
      .eq('id', user.uid)
      .maybeSingle()

    if (error) {
      console.error('[Firebase] Error fetching user data:', error)
    }

    console.log('✅ [STEP 7/7] User data retrieved successfully')
    console.log('')
    console.log('📋 User Data from Supabase:')
    console.log('   • User ID:', userResponse?.id || 'Not found')
    console.log('   • Phone:', userResponse?.phone_number || 'Not set')
    console.log('   • Shop Name:', userResponse?.shop_name || 'Not set')
    console.log('   • Shop Details Filled:', userResponse?.shop_details_filled || false)
    console.log('   • Coins:', userResponse?.coins || 0)
    console.log('   • Auth Provider:', userResponse?.auth_provider || 'Not set')

    const shopDetailsFilled = userResponse?.shop_details_filled || false

    console.log('')
    console.log('╔════════════════════════════════════════════════════════════════╗')
    console.log('║  ✅ AUTHENTICATION COMPLETE - FINAL STATUS                    ║')
    console.log('╚════════════════════════════════════════════════════════════════╝')
    console.log('🔐 Authentication Status:')
    console.log('   • Firebase Auth: ✅ SUCCESS')
    console.log('   • Supabase Auth: ✅', authVerified ? 'SUCCESS' : 'FAILED')
    console.log('   • User Type:', isNewUser ? 'NEW USER' : 'EXISTING USER')
    console.log('   • Shop Details:', shopDetailsFilled ? '✅ FILLED' : '❌ NOT FILLED')
    console.log('')

    return {
      firebaseUser: user,
      idToken: updatedIdToken,
      isNewUser,
      shopDetailsFilled,
      userId: user.uid,
      phoneNumber: user.phoneNumber || ''
    }
  } catch (error) {
    console.error('[Firebase] Error verifying OTP:', error)
    throw error
  }
}

/**
 * Send Firebase ID token to backend for verification and custom claim addition
 * This is the same endpoint used by the Flutter app
 */
async function verifyTokenAndAddClaim(idToken: string): Promise<any> {
  try {
    console.log('[Firebase] Sending ID token to backend for verification and user creation')

    const response = await fetch(`${BACKEND_URL}/auth/verify-phone-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        idToken: idToken
      })
    })

    console.log('[Firebase] Backend response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Firebase] Backend verification failed:', errorText)
      throw new Error('Failed to verify token with backend')
    }

    const data = await response.json()
    console.log('[Firebase] Backend verification response:', data)
    console.log('[Firebase] Is new user:', data.isNewUser)

    if (data.user) {
      console.log('[Firebase] User record:', data.user)
    }

    return data
  } catch (error) {
    console.error('[Firebase] Token verification error:', error)
    throw new Error(`Failed to communicate with backend: ${error}`)
  }
}

/**
 * Verify Supabase authentication by checking users table access
 */
async function verifySupabaseAuthentication(
  supabaseClient: any,
  userId: string
): Promise<boolean> {
  try {
    console.log('[Firebase] Verifying Supabase authentication with users table access')

    const { data, error } = await supabaseClient
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('[Firebase] Supabase authentication verification failed:', error)
      return false
    }

    console.log('[Firebase] Supabase authentication verified successfully')
    return true
  } catch (error) {
    console.error('[Firebase] Supabase authentication verification error:', error)
    return false
  }
}

/**
 * Decode and print Firebase JWT token details
 */
function printTokenDetails(token: string) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.log('❌ Invalid JWT token format')
      return
    }

    // Decode payload (second part)
    const payload = parts[1]
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))

    console.log('   • Issuer:', decoded.iss)
    console.log('   • Audience:', decoded.aud)
    console.log('   • Subject (UID):', decoded.sub)
    console.log('   • Role Claim:', decoded.role || '❌ NOT SET')
    console.log('   • Issued At:', new Date(decoded.iat * 1000).toISOString())
    console.log('   • Expires At:', new Date(decoded.exp * 1000).toISOString())

    if (!decoded.role) {
      console.log('   ⚠️  WARNING: Role claim is missing! Supabase RLS will fail.')
    } else if (decoded.role === 'authenticated') {
      console.log('   ✅ Role claim is set correctly: authenticated')
    }
  } catch (error) {
    console.error('❌ Error decoding token:', error)
  }
}

/**
 * Sign out from Firebase
 */
export async function signOutFirebase() {
  try {
    const auth = getFirebaseAuth()
    await auth.signOut()
    console.log('[Firebase] Signed out successfully')
  } catch (error) {
    console.error('[Firebase] Error signing out:', error)
    throw error
  }
}

/**
 * Get current Firebase user
 */
export function getCurrentFirebaseUser(): FirebaseUser | null {
  const auth = getFirebaseAuth()
  return auth.currentUser
}

/**
 * Get current Firebase ID token
 */
export async function getCurrentFirebaseIdToken(): Promise<string | null> {
  const user = getCurrentFirebaseUser()
  if (!user) return null
  
  try {
    return await user.getIdToken()
  } catch (error) {
    console.error('[Firebase] Error getting ID token:', error)
    return null
  }
}
