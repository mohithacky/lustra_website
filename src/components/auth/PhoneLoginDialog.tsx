'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { sendOtp, verifyOtp, checkPhoneExists, CustomerData } from '@/lib/api'

interface PhoneLoginDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (customerId: string, customerName: string) => void
  shopName?: string | null
  shopId: string
  isDark: boolean
}

export default function PhoneLoginDialog({
  isOpen,
  onClose,
  onSuccess,
  shopName,
  shopId,
  isDark,
}: PhoneLoginDialogProps) {
  const [isSignupMode, setIsSignupMode] = useState(true)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [normalizedPhone, setNormalizedPhone] = useState('')
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    
    setIsSendingOtp(true)
    setError(null)

    try {
      // For login mode, check if phone exists first
      if (!isSignupMode) {
        const exists = await checkPhoneExists(phoneNumber, shopId)
        if (!exists) {
          setError('Phone number not registered. Please sign up first.')
          setIsSendingOtp(false)
          return
        }
      }

      // Use Twilio backend to send OTP
      const success = await sendOtp(phoneNumber, shopId)
      if (success) {
        setCodeSent(true)
        setNormalizedPhone(phoneNumber)
      } else {
        setError('Failed to send OTP. Please try again.')
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to send OTP. Please try again.'
      setError(errorMessage)
    } finally {
      setIsSendingOtp(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      setError('Please enter the 6-digit code')
      return
    }

    setIsVerifyingOtp(true)
    setError(null)

    try {
      // Use Twilio backend to verify OTP and get customer data
      const customer: CustomerData = await verifyOtp(
        normalizedPhone,
        otp,
        shopId,
        isSignupMode ? name.trim() : undefined
      )

      // Store customer in localStorage (matching Flutter's approach)
      localStorage.setItem('websiteCustomer', JSON.stringify({
        id: customer.id,
        twilio_uid: customer.twilio_uid,
        name: customer.name,
        phone: customer.phone_number,
        email: customer.email,
        shopId,
      }))
      
      onSuccess(customer.id, customer.name || '')
      onClose()
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to verify OTP. Please try again.'
      setError(errorMessage)
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  const handleChangeNumber = () => {
    setCodeSent(false)
    setOtp('')
    setError(null)
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

        {/* Submit button */}
        <button
          onClick={codeSent ? handleVerifyOtp : handleSendOtp}
          disabled={isSendingOtp || isVerifyingOtp}
          className="w-full bg-gold-500 hover:bg-gold-600 text-white py-3 rounded-full font-semibold transition-colors disabled:opacity-50"
        >
          {codeSent
            ? (isVerifyingOtp ? 'Verifying...' : 'Verify & Continue')
            : (isSendingOtp ? 'Sending...' : 'Send OTP')}
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
      </div>
    </div>
  )
}
 