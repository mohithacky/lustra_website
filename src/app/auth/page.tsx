'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import PhoneAuthForm from '@/components/auth/PhoneAuthForm'
import { initializeFirebase } from '@/lib/firebase'
import { LogIn, UserPlus } from 'lucide-react'

export default function AuthPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [returnUrl, setReturnUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  useEffect(() => {
    initializeFirebase()
    
    const url = searchParams.get('returnUrl')
    if (url) {
      setReturnUrl(decodeURIComponent(url))
    } else {
      setReturnUrl('/')
    }
    
    const mode = searchParams.get('mode')
    if (mode === 'signup') {
      setAuthMode('signup')
    }
    
    setIsLoading(false)
  }, [searchParams])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to Lustra AI
            </h1>
            <p className="text-gray-600">
              {authMode === 'login' ? 'Sign in to continue' : 'Create a new account'}
            </p>
          </div>

          {/* Auth Mode Toggle */}
          <div className="flex items-center rounded-lg bg-gray-100 p-1 mb-6">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex items-center justify-center gap-2 flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${authMode === 'login' ? 'bg-white shadow-sm text-amber-700' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <LogIn className="w-4 h-4" />
              Login
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              className={`flex items-center justify-center gap-2 flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${authMode === 'signup' ? 'bg-white shadow-sm text-amber-700' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <UserPlus className="w-4 h-4" />
              Sign Up
            </button>
          </div>
          
          <PhoneAuthForm 
            returnUrl={returnUrl} 
            isNewUser={authMode === 'signup'} 
          />
        </div>
        
        <p className="text-center text-sm text-gray-600 mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>

        {/* Original Site Link */}
        {returnUrl && returnUrl.startsWith('http') && (
          <div className="mt-4 text-center">
            <p className="text-xs text-amber-700 mb-1">You will be redirected to:</p>
            <a 
              href={returnUrl} 
              className="text-sm text-amber-600 hover:text-amber-800 underline truncate max-w-[300px] inline-block"
            >
              {new URL(returnUrl).hostname}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
