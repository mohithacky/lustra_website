'use client'

/**
 * Firebase Phone Login Dialog for Next.js Website
 * 
 * This replaces the Twilio-based authentication with Firebase phone auth,
 * matching the Flutter app's implementation.
 */

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  initializeRecaptcha, 
  sendFirebaseOtp, 
  verifyFirebaseOtp,
  FirebaseAuthResult 
} from '@/lib/firebaseAuth'
import { RecaptchaVerifier, ConfirmationResult } from 'firebase/auth'
import { authenticateCustomer, checkCustomerExists } from '@/lib/customerApi'
import { AlertCircle } from 'lucide-react'

interface FirebasePhoneLoginDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (userId: string, userName: string, authResult: FirebaseAuthResult) => void
  shopName?: string | null
  shopId: string
  isDark: boolean
}

export default function FirebasePhoneLoginDialog({
  isOpen,
  onClose,
  onSuccess,
  shopName,
  shopId,
  isDark,
}: FirebasePhoneLoginDialogProps) {
  const [isSignupMode, setIsSignupMode] = useState(true)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [normalizedPhone, setNormalizedPhone] = useState('')
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null)
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const [existingCustomerName, setExistingCustomerName] = useState<string | null>(null)
  const [showExistingCustomerWarning, setShowExistingCustomerWarning] = useState(false)

  // Initialize reCAPTCHA when component mounts
  useEffect(() => {
    if (isOpen && !recaptchaVerifier) {
      try {
        const verifier = initializeRecaptcha('recaptcha-container')
        setRecaptchaVerifier(verifier)
        console.log('[Firebase] reCAPTCHA initialized')
      } catch (error) {
        console.error('[Firebase] Error initializing reCAPTCHA:', error)
      }
    }
  }, [isOpen, recaptchaVerifier])

  // Cleanup reCAPTCHA on unmount
  useEffect(() => {
    return () => {
      if (recaptchaVerifier) {
        recaptchaVerifier.clear()
      }
    }
  }, [recaptchaVerifier])

  if (!isOpen) return null

  const handleSendOtp = async () => {
    // Validate inputs
    if (isSignupMode && !name.trim()) {
      setError('Please enter your name')
      return
    }
    if (!phone.trim()) {
      setError('Please enter your mobile number')
      return
    }

    const phoneNumber = phone.startsWith('+91') ? phone : `+91${phone.replace(/\D/g, '')}`
    
    if (!recaptchaVerifier) {
      setError('reCAPTCHA not initialized. Please refresh the page.')
      return
    }

    setIsSendingOtp(true)
    setError(null)
    setShowExistingCustomerWarning(false)
    setExistingCustomerName(null)

    try {
      // If signup mode, check if customer already exists
      if (isSignupMode) {
        console.log('[Firebase] Checking if customer already exists...')
        const { exists, customerName } = await checkCustomerExists(phoneNumber, shopId)
        
        if (exists) {
          console.log('[Firebase] Customer already exists:', customerName)
          setExistingCustomerName(customerName)
          setShowExistingCustomerWarning(true)
          setIsSendingOtp(false)
          return // Don't send OTP, prompt user to login instead
        }
      }
      
      // If login mode, check if customer exists
      if (!isSignupMode) {
        console.log('[Firebase] Checking if customer exists for login...')
        const { exists, customerName } = await checkCustomerExists(phoneNumber, shopId)
        
        if (!exists) {
          console.log('[Firebase] Customer does not exist')
          setError('Phone number not registered. Please sign up first.')
          setIsSendingOtp(false)
          return // Don't send OTP, prompt user to signup instead
        }
        console.log('[Firebase] Customer exists:', customerName)
      }

      console.log('[Firebase] Sending OTP to:', phoneNumber)
      
      const confirmation = await sendFirebaseOtp(phoneNumber, recaptchaVerifier)
      
      setConfirmationResult(confirmation)
      setCodeSent(true)
      setNormalizedPhone(phoneNumber)
      console.log('[Firebase] OTP sent successfully')
    } catch (e: any) {
      console.error('[Firebase] Error sending OTP:', e)
      
      let errorMessage = 'Failed to send OTP. Please try again.'
      
      // Handle specific Firebase errors
      if (e.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format'
      } else if (e.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.'
      } else if (e.code === 'auth/quota-exceeded') {
        errorMessage = 'SMS quota exceeded. Please try again later.'
      }
      
      setError(errorMessage)
      
      // Reset reCAPTCHA on error
      if (recaptchaVerifier) {
        recaptchaVerifier.clear()
        const newVerifier = initializeRecaptcha('recaptcha-container')
        setRecaptchaVerifier(newVerifier)
      }
    } finally {
      setIsSendingOtp(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      setError('Please enter the 6-digit code')
      return
    }

    if (!confirmationResult) {
      setError('No confirmation result. Please resend OTP.')
      return
    }

    setIsVerifyingOtp(true)
    setError(null)

    try {
      console.log('[Firebase] Verifying OTP...')
      
      // This follows the exact same flow as Flutter app
      const authResult = await verifyFirebaseOtp(confirmationResult, otp)
      
      console.log('[Firebase] Authentication successful!')
      console.log('[Firebase] User ID:', authResult.userId)
      console.log('[Firebase] Is new user:', authResult.isNewUser)
      console.log('[Firebase] Shop details filled:', authResult.shopDetailsFilled)
      
      // Create or update customer record via backend service role
      console.log('[Firebase] Creating/updating customer record via backend...')
      
      // Send encrypted request to backend for customer creation/update
      const backendResponse = await authenticateCustomer(authResult.idToken, {
        isSignup: isSignupMode,
        fullName: name.trim() || undefined,
        shopOwnerId: shopId,
        shopDomain: undefined
      })
      
      console.log('[Firebase] Backend response:', backendResponse)
      
      const customer = backendResponse.customer
      const isNewCustomer = backendResponse.isNewUser
      
      // This case is now handled by backend validation
      // Backend will return 404 with CUSTOMER_NOT_FOUND if login attempt for non-existent customer
      
      // Create a customerData object similar to what the API would return
      const customerData = {
        customer: {
          id: customer?.id,
          firebase_uid: customer?.firebase_uid,
          phone_number: customer?.phone_number,
          name: customer?.name,
          email: null
        },
        isNewCustomer
      }
      console.log('[Firebase] Customer record created:', customerData.customer.id)
      console.log('[Firebase] Is new customer:', customerData.isNewCustomer)
      
      // Store authentication data in localStorage
      localStorage.setItem('firebaseAuth', JSON.stringify({
        userId: authResult.userId,
        phoneNumber: authResult.phoneNumber,
        idToken: authResult.idToken,
        isNewUser: authResult.isNewUser,
        shopDetailsFilled: authResult.shopDetailsFilled,
        customerId: customerData.customer.id,
        customerName: customerData.customer.name,
        shopId,
        timestamp: Date.now()
      }))
      
      // Call success callback with customer name
      onSuccess(
        String(customerData.customer.id), 
        customerData.customer.name || authResult.phoneNumber, 
        authResult
      )
      onClose()
    } catch (e: any) {
      console.error('[Firebase] Error verifying OTP:', e)
      
      let errorMessage = 'Failed to verify OTP. Please try again.'
      
      // Handle specific Firebase errors
      if (e.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid verification code. Please check and try again.'
      } else if (e.code === 'auth/code-expired') {
        errorMessage = 'Verification code expired. Please request a new one.'
      } else if (e.message && e.message.includes('not registered')) {
        // Backend returned CUSTOMER_NOT_FOUND error
        errorMessage = 'Phone number not registered. Please sign up first.'
        // Switch to signup mode
        setIsSignupMode(true)
        setCodeSent(false)
        setOtp('')
        setConfirmationResult(null)
      } else if (e.message) {
        errorMessage = e.message
      }
      
      setError(errorMessage)
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  const handleChangeNumber = () => {
    setCodeSent(false)
    setOtp('')
    setError(null)
    setConfirmationResult(null)
  }

  const bgColor = isDark ? 'bg-[#080808]' : 'bg-white'
  const textColor = isDark ? 'text-white' : 'text-gray-900'
  const mutedText = isDark ? 'text-gray-400' : 'text-gray-500'
  const inputBg = isDark ? 'bg-zinc-900' : 'bg-gray-50'
  const inputBorder = isDark ? 'border-zinc-700' : 'border-gray-300'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className={cn(
        'relative w-full max-w-md mx-4 rounded-3xl shadow-2xl p-6',
        bgColor
      )}>
        {/* Close button */}
        <button
          onClick={onClose}
          className={cn('absolute top-4 right-4 p-1', mutedText)}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <h2 className={cn('font-display text-2xl font-bold mb-2', textColor)}>
          {codeSent ? 'Enter OTP' : `${isSignupMode ? 'Sign up' : 'Login'} to ${shopName || 'Store'}`}
        </h2>
        <p className={cn('text-sm mb-5', mutedText)}>
          {codeSent
            ? `We've sent a 6-digit code to ${normalizedPhone}`
            : isSignupMode
              ? 'Enter your name and mobile number to create an account.'
              : 'Enter your mobile number to login.'}
        </p>

        {!codeSent ? (
          <>
            {/* Login/Signup Toggle */}
            <div className="flex justify-center gap-2 mb-5">
              <button
                onClick={() => { setIsSignupMode(true); setError(null); }}
                className={cn(
                  'px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors',
                  isSignupMode
                    ? 'bg-gold-500/10 text-gold-500'
                    : cn('bg-transparent', mutedText)
                )}
              >
                Sign Up
              </button>
              <button
                onClick={() => { setIsSignupMode(false); setError(null); }}
                className={cn(
                  'px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors',
                  !isSignupMode
                    ? 'bg-gold-500/10 text-gold-500'
                    : cn('bg-transparent', mutedText)
                )}
              >
                Login
              </button>
            </div>

            {/* Name field (signup only) */}
            {isSignupMode && (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className={cn(
                  'w-full px-4 py-3 rounded-xl border mb-3 outline-none transition-colors focus:border-gold-500',
                  inputBg, inputBorder, textColor
                )}
              />
            )}

            {/* Phone field */}
            <div className="relative mb-3">
              <span className={cn('absolute left-4 top-1/2 -translate-y-1/2 text-sm', mutedText)}>
                +91
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="98765 43210"
                className={cn(
                  'w-full pl-12 pr-4 py-3 rounded-xl border outline-none transition-colors focus:border-gold-500',
                  inputBg, inputBorder, textColor
                )}
              />
            </div>
          </>
        ) : (
          /* OTP field */
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter 6-digit code"
            maxLength={6}
            className={cn(
              'w-full px-4 py-3 rounded-xl border mb-3 outline-none transition-colors focus:border-gold-500 text-center text-lg tracking-widest',
              inputBg, inputBorder, textColor
            )}
          />
        )}

        {/* Error message */}
        {error && (
          <p className="text-red-500 text-sm mb-3">{error}</p>
        )}

        {/* Warning for existing customer trying to signup */}
        {showExistingCustomerWarning && (
          <div className={cn(
            'px-4 py-3 rounded-xl mb-3 border',
            isDark ? 'bg-amber-900/30 border-amber-700 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'
          )}>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Account already exists!</p>
                <p className="text-xs mt-1">
                  {existingCustomerName 
                    ? `An account exists for ${existingCustomerName}.`
                    : 'An account with this phone number already exists.'}
                </p>
                <button
                  onClick={() => { setIsSignupMode(false); setShowExistingCustomerWarning(false); }}
                  className="text-xs mt-2 font-semibold underline hover:no-underline"
                >
                  Switch to Login
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={codeSent ? handleVerifyOtp : handleSendOtp}
          disabled={isSendingOtp || isVerifyingOtp || showExistingCustomerWarning}
          className="w-full bg-gold-500 hover:bg-gold-600 text-white py-3 rounded-full font-semibold transition-colors disabled:opacity-50"
        >
          {codeSent
            ? (isVerifyingOtp ? 'Verifying...' : 'Verify & Continue')
            : (isSendingOtp ? (isSignupMode ? 'Checking...' : 'Sending...') : 'Send OTP')}
        </button>

        {/* Secondary actions */}
        <div className="flex justify-between mt-4">
          {codeSent && (
            <>
              <button
                onClick={handleSendOtp}
                disabled={isSendingOtp || isVerifyingOtp}
                className={cn('text-sm', mutedText)}
              >
                Resend code
              </button>
              <button
                onClick={handleChangeNumber}
                disabled={isSendingOtp || isVerifyingOtp}
                className={cn('text-sm', mutedText)}
              >
                Change number
              </button>
            </>
          )}
        </div>

        {/* reCAPTCHA container (invisible) */}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  )
}
