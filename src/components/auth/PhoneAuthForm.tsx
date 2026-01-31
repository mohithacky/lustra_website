'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RecaptchaVerifier, ConfirmationResult } from 'firebase/auth'
import { 
  initializeRecaptcha, 
  sendFirebaseOtp, 
  verifyFirebaseOtp 
} from '@/lib/firebaseAuth'
import { Phone, ArrowRight, Loader2 } from 'lucide-react'

interface PhoneAuthFormProps {
  returnUrl: string
  isNewUser?: boolean
}

export default function PhoneAuthForm({ returnUrl, isNewUser = false }: PhoneAuthFormProps) {
  const router = useRouter()
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

      // Pass isNewUser as a URL parameter to the backend
      const result = await verifyFirebaseOtp(confirmationResult, otp)
      console.log('[Auth] Authentication successful:', result)
      console.log('[Auth] Is new user:', isNewUser ? 'Yes' : 'No')

      // Store the user type in localStorage for the receiving domain
      if (isNewUser) {
        localStorage.setItem('auth_user_type', 'new_user')
      }
      
      // Handle cross-domain redirect
      if (returnUrl.startsWith('http')) {
        // For cross-domain redirects, we need to use window.location
        // Add signup indicator to the URL if this is a new user
        const url = new URL(returnUrl)
        if (isNewUser) {
          url.searchParams.append('new_user', 'true')
        }
        window.location.href = url.toString()
      } else {
        // For same-domain redirects, we can use the router
        if (isNewUser) {
          router.push(`${returnUrl}${returnUrl.includes('?') ? '&' : '?'}new_user=true`)
        } else {
          router.push(returnUrl)
        }
      }
    } catch (err: any) {
      console.error('Error verifying OTP:', err)
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
