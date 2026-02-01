'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RecaptchaVerifier, ConfirmationResult } from 'firebase/auth'
import { 
  initializeRecaptcha, 
  sendFirebaseOtp, 
  verifyFirebaseOtp,
  verifyFirebaseOtpWithCustomData,
  CustomerData
} from '@/lib/firebaseAuth'
import { getSupabaseClient } from '@/lib/supabaseFirebaseClient'
import { Phone, ArrowRight, Loader2 } from 'lucide-react'
import { useShopStore } from '@/store/shopStore'

interface PhoneAuthFormProps {
  returnUrl: string
  isNewUser?: boolean
  shopOwnerId?: string  // Optional: pass directly from parent if available
  shopDomain?: string   // Optional: pass directly from parent if available
}

export default function PhoneAuthForm({ 
  returnUrl, 
  isNewUser = false,
  shopOwnerId: propShopOwnerId,
  shopDomain: propShopDomain
}: PhoneAuthFormProps) {
  // Get shop owner data from Zustand global state
  const shopOwnerIdFromStore = useShopStore((state) => state.shopOwnerId)
  const shopDomainFromStore = useShopStore((state) => state.shopDomain)
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null)
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)

  useEffect(() => {
    const verifier = initializeRecaptcha('recaptcha-container')
    if (verifier) {
      setRecaptchaVerifier(verifier)
    }
  }, [])

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!recaptchaVerifier) {
        throw new Error('reCAPTCHA not initialized')
      }

      let formattedPhone = phoneNumber.trim()
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+91' + formattedPhone
      }

      const confirmation = await sendFirebaseOtp(formattedPhone, recaptchaVerifier)
      setConfirmationResult(confirmation)
      setStep('otp')
    } catch (err: any) {
      console.error('Error sending OTP:', err)
      setError(err.message || 'Failed to send OTP. Please try again.')
      
      const verifier = initializeRecaptcha('recaptcha-container')
      if (verifier) {
        setRecaptchaVerifier(verifier)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!confirmationResult) {
        throw new Error('No confirmation result available')
      }

      console.log('[Auth] Starting verification with OTP:', '******')
      console.log('[Auth] User is signup:', isNewUser ? 'Yes' : 'No')
      if (isNewUser) {
        console.log('[Auth] User fullName:', fullName || 'Not provided')
      }

      // Store the name in localStorage for backend access
      if (isNewUser && fullName) {
        localStorage.setItem('signup_full_name', fullName)
      }

      // Extract shop owner user_id - Priority: Zustand store > props > URL extraction
      let shopOwnerId = shopOwnerIdFromStore || propShopOwnerId || ''
      let shopDomain = shopDomainFromStore || propShopDomain || ''
      
      console.log('[Auth] ========== SHOP OWNER LOOKUP START ==========')
      console.log('[Auth] Zustand Store - shopOwnerId:', shopOwnerIdFromStore || '(not in store)')
      console.log('[Auth] Zustand Store - shopDomain:', shopDomainFromStore || '(not in store)')
      console.log('[Auth] Props - shopOwnerId:', propShopOwnerId || '(not provided)')
      console.log('[Auth] Props - shopDomain:', propShopDomain || '(not provided)')
      console.log('[Auth] Return URL:', returnUrl)
      
      // If not available from store or props, extract from returnUrl as fallback
      if (!shopOwnerId || !shopDomain) {
        console.log('[Auth] Shop info not in store or props, extracting from returnUrl as fallback...')
        
        try {
          if (returnUrl.startsWith('http')) {
            const url = new URL(returnUrl)
            const hostname = url.hostname
            console.log('[Auth] Hostname:', hostname)
            
            // Extract subdomain (e.g., ashishjewellers from ashishjewellers.lustrai.in)
            const parts = hostname.split('.')
            console.log('[Auth] Hostname parts:', parts)
            console.log('[Auth] Parts length:', parts.length)
            console.log('[Auth] Contains lustrai.in:', hostname.includes('lustrai.in'))
            
            if (parts.length >= 3 && hostname.includes('lustrai.in')) {
              shopDomain = parts[0] // e.g., 'ashishjewellers'
              console.log('[Auth] ✅ Extracted shop domain:', shopDomain)
              
              // Query users table to get shop owner's user_id
              console.log('[Auth] Querying users table for shop_domain:', shopDomain)
              const supabase = getSupabaseClient()
              const { data: shopOwner, error } = await supabase
                .from('users')
                .select('id, shop_domain, email')
                .eq('shop_domain', shopDomain)
                .single()
              
              console.log('[Auth] Query result - data:', shopOwner)
              console.log('[Auth] Query result - error:', error)
              
              if (error) {
                console.error('[Auth] ❌ Error fetching shop owner:', error.message, error.details, error.hint)
              } else if (shopOwner) {
                shopOwnerId = shopOwner.id
                console.log('[Auth] ✅ Found shop owner ID:', shopOwnerId)
                console.log('[Auth] Shop owner email:', shopOwner.email)
              } else {
                console.warn('[Auth] ⚠️ No shop owner found for domain:', shopDomain)
              }
            } else {
              console.log('[Auth] ⚠️ Subdomain extraction failed - not a valid lustrai.in subdomain')
            }
          } else {
            console.log('[Auth] ⚠️ Return URL does not start with http - cannot extract subdomain')
          }
        } catch (e) {
          console.error('[Auth] ❌ Error extracting shop info from URL:', e)
        }
      } else {
        const source = shopOwnerIdFromStore ? 'Zustand Store' : (propShopOwnerId ? 'Props' : 'Unknown')
        console.log(`[Auth] ✅ Using shop info from ${source}`)
      }
      
      console.log('[Auth] Final shopOwnerId:', shopOwnerId || '(empty - will default to "default")')
      console.log('[Auth] Final shopDomain:', shopDomain || '(empty)')
      console.log('[Auth] Source:', shopOwnerIdFromStore ? '🟢 Zustand Store' : (propShopOwnerId ? '🟡 Props' : '🔴 URL Extraction'))
      console.log('[Auth] ========== SHOP OWNER LOOKUP END ==========')
      console.log('')

      // Get the custom authentication data to pass to the backend
      const authData = {
        isSignup: isNewUser,
        fullName: fullName || '',
        shopId: shopOwnerId,
        shopDomain: shopDomain,
      }

      // Verify OTP and create user in Supabase
      const result = await verifyFirebaseOtpWithCustomData(confirmationResult, otp, authData)
      console.log('[Auth] Authentication successful:', result)
      console.log('[Auth] Is new user:', isNewUser ? 'Yes' : 'No')
      
      // Store user info in localStorage for the receiving domain
      if (isNewUser) {
        localStorage.setItem('auth_user_type', 'new_user')
        if (fullName) {
          localStorage.setItem('auth_user_name', fullName)
        }
      }
      
      // Always ensure redirect back to original domain
      console.log('[Auth] Preparing redirect to:', returnUrl)
      
      // Ensure we have a proper URL to redirect to - if root path, prepend referrer origin
      let redirectTarget = returnUrl
      
      // For bare paths like '/' that don't have a domain, try to extract referrer domain
      if (!returnUrl.startsWith('http') && document.referrer && document.referrer.startsWith('http')) {
        try {
          // Extract the origin from the referrer
          const referrerUrl = new URL(document.referrer)
          // If returnUrl is a relative path (like '/'), prefix with the referrer's origin
          if (returnUrl === '/' || returnUrl.startsWith('/')) {
            redirectTarget = `${referrerUrl.origin}${returnUrl}`
            console.log('[Auth] Enhanced relative URL with referrer origin:', redirectTarget)
          }
        } catch (e) {
          console.error('[Auth] Error parsing referrer URL:', e)
        }
      }
      
      // Now process the URL for redirect - ensure it's a full URL for subdomain redirects
      if (redirectTarget.startsWith('http')) {
        console.log('[Auth] Using cross-domain redirect to:', redirectTarget)
        
        // Parse the URL to add params
        const url = new URL(redirectTarget)
        
        // Add signup/login indicators to the URL
        if (isNewUser) {
          url.searchParams.append('new_user', 'true')
          if (fullName) {
            url.searchParams.append('name', encodeURIComponent(fullName))
          }
        }
        
        // Use the original full URL with subdomain intact
        const finalUrl = url.toString()
        console.log('[Auth] Final redirect URL:', finalUrl)
        
        // Force window location to handle cross-domain redirect
        window.location.href = finalUrl
      } else {
        // Handle relative URLs (shouldn't happen with the cross-domain flow, but just in case)
        console.log('[Auth] Same-domain redirect (WARNING: may lose subdomain!):', redirectTarget)
        if (isNewUser) {
          let redirectUrl = `${redirectTarget}${redirectTarget.includes('?') ? '&' : '?'}new_user=true`
          if (fullName) {
            redirectUrl += `&name=${encodeURIComponent(fullName)}`
          }
          router.push(redirectUrl)
        } else {
          router.push(redirectTarget)
        }
        
        // Display warning in console
        console.warn('[Auth] WARNING: Using relative URL redirect which may not preserve subdomain!')
      }
    } catch (err: any) {
      console.error('[Auth] Error verifying OTP:', err)
      setError(err.message || 'Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setOtp('')
    setError('')
    setLoading(true)

    try {
      if (!recaptchaVerifier) {
        throw new Error('reCAPTCHA not initialized')
      }

      let formattedPhone = phoneNumber.trim()
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+91' + formattedPhone
      }

      const confirmation = await sendFirebaseOtp(formattedPhone, recaptchaVerifier)
      setConfirmationResult(confirmation)
    } catch (err: any) {
      console.error('Error resending OTP:', err)
      setError(err.message || 'Failed to resend OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div id="recaptcha-container"></div>

      {step === 'phone' ? (
        <form onSubmit={handleSendOtp} className="space-y-6">
          {isNewUser && (
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required={isNewUser}
                  disabled={loading}
                />
              </div>
            </div>
          )}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter your phone number"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
                disabled={loading}
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Enter with country code (e.g., +919876543210)
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !phoneNumber}
            className="w-full flex items-center justify-center gap-2 bg-amber-600 text-white py-3 px-4 rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Sending OTP...
              </>
            ) : (
              <>
                Send OTP
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
              Enter OTP
            </label>
            <input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-center text-2xl tracking-widest"
              required
              disabled={loading}
              maxLength={6}
            />
            <p className="mt-2 text-sm text-gray-500">
              OTP sent to {phoneNumber}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full flex items-center justify-center gap-2 bg-amber-600 text-white py-3 px-4 rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                Verify OTP
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setStep('phone')
                setOtp('')
                setError('')
              }}
              className="text-amber-600 hover:text-amber-700 font-medium"
              disabled={loading}
            >
              Change number
            </button>
            <button
              type="button"
              onClick={handleResendOtp}
              className="text-amber-600 hover:text-amber-700 font-medium"
              disabled={loading}
            >
              Resend OTP
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
