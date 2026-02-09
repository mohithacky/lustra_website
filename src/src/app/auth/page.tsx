'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import PhoneAuthForm from '@/components/auth/PhoneAuthForm'
import { initializeFirebase } from '@/lib/firebase'
import { getSupabaseClient } from '@/lib/supabaseFirebaseClient'
import { LogIn, UserPlus } from 'lucide-react'

export default function AuthPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [returnUrl, setReturnUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [shopOwnerId, setShopOwnerId] = useState<string>('')
  const [shopDomain, setShopDomain] = useState<string>('')
  const [shopName, setShopName] = useState<string>('Lustra AI')

  useEffect(() => {
    const initAuth = async () => {
      initializeFirebase()
      
      const url = searchParams.get('returnUrl')
      if (url) {
        setReturnUrl(decodeURIComponent(url))
      } else {
        setReturnUrl('/')
      }
      
      // Extract shopOwnerId and shopDomain from query params
      const ownerIdParam = searchParams.get('shopOwnerId')
      const domainParam = searchParams.get('shopDomain')
      
      let finalShopOwnerId = ''
      let finalShopDomain = ''
      let finalShopName = 'Lustra AI'
      
      if (ownerIdParam) {
        finalShopOwnerId = decodeURIComponent(ownerIdParam)
        console.log('[Auth Page] shopOwnerId from URL:', finalShopOwnerId)
      }
      if (domainParam) {
        finalShopDomain = decodeURIComponent(domainParam)
        console.log('[Auth Page] shopDomain from URL:', finalShopDomain)
      }
      
      // If we don't have shop info from params, try to extract from returnUrl
      if (!finalShopOwnerId || !finalShopDomain) {
        const returnUrlValue = url ? decodeURIComponent(url) : '/'
        if (returnUrlValue.startsWith('http')) {
          try {
            const urlObj = new URL(returnUrlValue)
            const hostname = urlObj.hostname
            const parts = hostname.split('.')
            
            // Extract subdomain (e.g., ashmitjewellers from ashmitjewellers.lustrai.in)
            if (parts.length >= 3 && hostname.includes('lustrai.in')) {
              finalShopDomain = parts[0]
              console.log('[Auth Page] Extracted shop domain from returnUrl:', finalShopDomain)
            }
          } catch (e) {
            console.error('[Auth Page] Error parsing returnUrl:', e)
          }
        }
      }
      
      // Fetch shop owner data from users table if we have a shop domain
      if (finalShopDomain) {
        try {
          console.log('[Auth Page] Fetching shop owner data for domain:', finalShopDomain)
          const supabase = getSupabaseClient()
          const { data: shopOwner, error } = await supabase
            .from('users')
            .select('id, shop_domain, shop_name')
            .eq('shop_domain', finalShopDomain)
            .single()
          
          if (error) {
            console.error('[Auth Page] Error fetching shop owner:', error)
          } else if (shopOwner) {
            finalShopOwnerId = shopOwner.id
            finalShopName = shopOwner.shop_name || 'Lustra AI'
            console.log('[Auth Page] Found shop owner:', {
              id: finalShopOwnerId,
              domain: shopOwner.shop_domain,
              name: finalShopName
            })
          } else {
            console.warn('[Auth Page] No shop owner found for domain:', finalShopDomain)
          }
        } catch (e) {
          console.error('[Auth Page] Error fetching shop owner data:', e)
        }
      }
      
      setShopOwnerId(finalShopOwnerId)
      setShopDomain(finalShopDomain)
      setShopName(finalShopName)
      
      const mode = searchParams.get('mode')
      if (mode === 'signup') {
        setAuthMode('signup')
      }
      
      setIsLoading(false)
    }
    
    initAuth()
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
              Welcome to {shopName}
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
            shopOwnerId={shopOwnerId}
            shopDomain={shopDomain}
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
