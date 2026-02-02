/**
 * Firebase Phone Authentication Service for Next.js Website
 * 
 * This implements Firebase phone auth with backend service role for Supabase:
 * 1. Send OTP via Firebase
 * 2. Verify OTP and get Firebase user
 * 3. Get Firebase ID token
 * 4. Send encrypted request to backend to create/update customer via service role
 * 5. Backend handles all Supabase operations with service role key
 */

import { 
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  User as FirebaseUser
} from 'firebase/auth'
import { getFirebaseAuth } from './firebase'
import { authenticateCustomer, CustomerAuthResponse } from './customerApi'

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
 * Customer data interface for Supabase integration
 */
export interface CustomerData {
  isSignup: boolean;
  fullName?: string;
  shopId?: string;
  shopDomain?: string;
  metadata?: Record<string, any>;
}

/**
 * Verify OTP and complete Firebase phone authentication
 * Uses backend service role for all Supabase operations
 */
export async function verifyFirebaseOtp(
  confirmationResult: ConfirmationResult,
  otp: string
): Promise<FirebaseAuthResult> {
  try {
    console.log('')
    console.log('╔════════════════════════════════════════════════════════════════╗')
    console.log('║  FIREBASE PHONE AUTH - BACKEND SERVICE ROLE FLOW              ║')
    console.log('╚════════════════════════════════════════════════════════════════╝')
    console.log('')

    // STEP 1: Sign in to Firebase with OTP
    console.log('📱 [STEP 1/4] Verifying OTP with Firebase...')
    const userCredential = await confirmationResult.confirm(otp)
    const user = userCredential.user
    console.log('✅ [STEP 1/4] Firebase sign-in completed successfully')
    console.log('   • User ID:', user.uid)
    console.log('   • Phone:', user.phoneNumber)

    // STEP 2: Get Firebase ID token
    console.log('')
    console.log('🔑 [STEP 2/4] Obtaining Firebase ID token...')
    const idToken = await user.getIdToken()
    console.log('✅ [STEP 2/4] Firebase ID token obtained:', idToken.substring(0, 20) + '...')

    // Print token details
    console.log('')
    console.log('� Token Details:')
    printTokenDetails(idToken)

    // STEP 3: Send request to backend for customer creation/update
    console.log('')
    console.log('� [STEP 3/4] Sending encrypted request to backend...')
    console.log('   • Backend will create/update customer using service role')
    
    let backendResponse: CustomerAuthResponse
    try {
      backendResponse = await authenticateCustomer(idToken, {
        isSignup: false, // Login flow
        fullName: undefined,
        shopOwnerId: undefined,
        shopDomain: undefined
      })
      console.log('✅ [STEP 3/4] Backend authentication successful')
      console.log('   • Is new user:', backendResponse.isNewUser)
      console.log('   • Customer ID:', backendResponse.customer?.id)
    } catch (backendError) {
      console.error('❌ [STEP 3/4] Backend authentication failed:', backendError)
      throw new Error('Failed to authenticate with backend')
    }

    // STEP 4: Return authentication result
    console.log('')
    console.log('📊 [STEP 4/4] Processing authentication result...')
    
    const isNewUser = backendResponse.isNewUser
    const customer = backendResponse.customer

    console.log('')
    console.log('📋 Customer Data from Backend:')
    console.log('   • Customer ID:', customer?.id || 'Not found')
    console.log('   • Firebase UID:', customer?.firebase_uid || 'Not set')
    console.log('   • Phone:', customer?.phone_number || 'Not set')
    console.log('   • Name:', customer?.name || 'Not set')

    console.log('')
    console.log('╔════════════════════════════════════════════════════════════════╗')
    console.log('║  ✅ AUTHENTICATION COMPLETE - FINAL STATUS                    ║')
    console.log('╚════════════════════════════════════════════════════════════════╝')
    console.log('🔐 Authentication Status:')
    console.log('   • Firebase Auth: ✅ SUCCESS')
    console.log('   • Backend Auth: ✅ SUCCESS')
    console.log('   • User Type:', isNewUser ? 'NEW USER' : 'EXISTING USER')
    console.log('')

    return {
      firebaseUser: user,
      idToken: idToken,
      isNewUser,
      shopDetailsFilled: false,
      userId: user.uid,
      phoneNumber: user.phoneNumber || ''
    }
  } catch (error) {
    console.error('[Firebase] Error verifying OTP:', error)
    throw error
  }
}

/**
 * Verify OTP with custom data (for user signup)
 * Enhanced version that accepts customer data for new user registration
 * Uses backend service role for all Supabase operations
 */
export async function verifyFirebaseOtpWithCustomData(
  confirmationResult: ConfirmationResult,
  otp: string,
  customerData: CustomerData
): Promise<FirebaseAuthResult> {
  try {
    console.log('')
    console.log('╔════════════════════════════════════════════════════════════════╗')
    console.log('║  FIREBASE PHONE AUTH - BACKEND SERVICE ROLE FLOW              ║')
    console.log('╚════════════════════════════════════════════════════════════════╝')
    console.log('')
    console.log('[Auth] Flow type:', customerData.isSignup ? 'SIGNUP' : 'LOGIN')
    if (customerData.isSignup) {
      console.log('[Auth] Customer name:', customerData.fullName || 'Not provided')
    }

    // STEP 1: Sign in to Firebase with OTP
    console.log('📱 [STEP 1/4] Verifying OTP with Firebase...')
    const userCredential = await confirmationResult.confirm(otp)
    const user = userCredential.user
    console.log('✅ [STEP 1/4] Firebase sign-in completed successfully')
    console.log('   • User ID:', user.uid)
    console.log('   • Phone:', user.phoneNumber)

    // STEP 2: Get Firebase ID token
    console.log('')
    console.log('🔑 [STEP 2/4] Obtaining Firebase ID token...')
    const idToken = await user.getIdToken()
    console.log('✅ [STEP 2/4] Firebase ID token obtained:', idToken.substring(0, 20) + '...')

    // Print token details
    console.log('')
    console.log('� Token Details:')
    printTokenDetails(idToken)

    // STEP 3: Send encrypted request to backend for customer creation/update
    console.log('')
    console.log('� [STEP 3/4] Sending encrypted request to backend...')
    console.log('   • Backend will create/update customer using service role')
    
    let backendResponse: CustomerAuthResponse
    try {
      backendResponse = await authenticateCustomer(idToken, {
        isSignup: customerData.isSignup,
        fullName: customerData.fullName,
        shopOwnerId: customerData.shopId,
        shopDomain: customerData.shopDomain
      })
      console.log('✅ [STEP 3/4] Backend authentication successful')
      console.log('   • Is new user:', backendResponse.isNewUser)
      console.log('   • Customer ID:', backendResponse.customer?.id)
    } catch (backendError) {
      console.error('❌ [STEP 3/4] Backend authentication failed:', backendError)
      throw new Error('Failed to authenticate with backend')
    }

    // STEP 4: Return authentication result
    console.log('')
    console.log('📊 [STEP 4/4] Processing authentication result...')
    
    const isNewUser = backendResponse.isNewUser
    const customer = backendResponse.customer

    console.log('')
    console.log('📋 Customer Data from Backend:')
    console.log('   • Customer ID:', customer?.id || 'Not found')
    console.log('   • Firebase UID:', customer?.firebase_uid || 'Not set')
    console.log('   • User ID:', customer?.user_id || 'Not set')
    console.log('   • Phone:', customer?.phone_number || 'Not set')
    console.log('   • Name:', customer?.name || 'Not set')
    console.log('   • Shop Domain:', customer?.shop_domain || 'Not set')

    console.log('')
    console.log('╔════════════════════════════════════════════════════════════════╗')
    console.log('║  ✅ AUTHENTICATION COMPLETE - FINAL STATUS                    ║')
    console.log('╚════════════════════════════════════════════════════════════════╝')
    console.log('🔐 Authentication Status:')
    console.log('   • Firebase Auth: ✅ SUCCESS')
    console.log('   • Backend Auth: ✅ SUCCESS')
    console.log('   • User Type:', isNewUser ? 'NEW USER' : 'EXISTING USER')
    console.log('')

    return {
      firebaseUser: user,
      idToken: idToken,
      isNewUser,
      shopDetailsFilled: false, // Customers don't have shop details
      userId: user.uid,
      phoneNumber: user.phoneNumber || ''
    }
  } catch (error) {
    console.error('[Firebase] Error verifying OTP:', error)
    throw error
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
