'use client'

/**
 * Customer Context - Persists customer session data throughout the website
 * 
 * This context manages customer-specific data using subdomain-scoped session cookies.
 * Each subdomain (e.g., ashmitjewellers.lustrai.in) has its own isolated session.
 * 
 * Flow:
 * 1. User authenticates on lustrai.in/auth via Firebase Phone OTP
 * 2. Auth page redirects to subdomain's /api/auth/callback with ID token
 * 3. Callback endpoint verifies token and sets HttpOnly session cookie
 * 4. This context reads session from /api/auth/session endpoint
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

// Customer data structure (from sessions table join with customers)
export interface CustomerData {
  id: number
  firebase_uid: string
  phone_number: string
  name: string | null
  email: string | null
  user_id: string
  shop_domain?: string
  created_at?: string
  updated_at?: string
}

interface SessionData {
  authenticated: boolean
  firebaseUid?: string
  customerId?: number
  subdomain?: string
  customer?: CustomerData
  expiresAt?: string
}

interface CustomerContextType {
  // Customer data from session
  customer: CustomerData | null
  // Firebase UID from session (not actual Firebase user object)
  firebaseUid: string | null
  // Loading state
  loading: boolean
  // Methods
  refreshSession: () => Promise<void>
  signOut: () => Promise<void>
  // Helper to check if customer is authenticated
  isAuthenticated: boolean
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined)

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<CustomerData | null>(null)
  const [firebaseUid, setFirebaseUid] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch session from API
  const fetchSession = useCallback(async () => {
    try {
      console.log('[CustomerContext] Checking session...')
      
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include', // Important: include cookies
      })
      
      if (response.ok) {
        const session: SessionData = await response.json()
        
        if (session.authenticated && session.customer) {
          console.log('[CustomerContext] Session active for:', session.firebaseUid)
          setFirebaseUid(session.firebaseUid || null)
          setCustomer(session.customer)
          
          // Cache for faster subsequent loads
          localStorage.setItem('customerData', JSON.stringify({
            ...session.customer,
            timestamp: Date.now()
          }))
        } else {
          console.log('[CustomerContext] No active session')
          setFirebaseUid(null)
          setCustomer(null)
          localStorage.removeItem('customerData')
        }
      } else {
        console.log('[CustomerContext] Session check failed:', response.status)
        setFirebaseUid(null)
        setCustomer(null)
        localStorage.removeItem('customerData')
      }
    } catch (error) {
      console.error('[CustomerContext] Error checking session:', error)
      setFirebaseUid(null)
      setCustomer(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Refresh session manually
  const refreshSession = useCallback(async () => {
    setLoading(true)
    await fetchSession()
  }, [fetchSession])

  // Sign out - calls DELETE /api/auth/session to invalidate session and clear cookie
  const signOut = useCallback(async () => {
    try {
      console.log('[CustomerContext] Signing out...')
      
      await fetch('/api/auth/session', {
        method: 'DELETE',
        credentials: 'include',
      })
      
      setFirebaseUid(null)
      setCustomer(null)
      localStorage.removeItem('customerData')
      console.log('[CustomerContext] Signed out successfully')
    } catch (error) {
      console.error('[CustomerContext] Error signing out:', error)
    }
  }, [])

  // Check session on mount
  useEffect(() => {
    // Try to load cached customer data first for faster initial render
    const cachedCustomerData = localStorage.getItem('customerData')
    if (cachedCustomerData) {
      try {
        const parsed = JSON.parse(cachedCustomerData)
        // Only use cache if less than 1 hour old
        if (parsed.timestamp && Date.now() - parsed.timestamp < 3600000) {
          setCustomer(parsed)
          console.log('[CustomerContext] Loaded cached customer data')
        }
      } catch (e) {
        console.warn('[CustomerContext] Invalid cached customer data')
      }
    }

    // Always verify session with server
    fetchSession()
  }, [fetchSession])

  const isAuthenticated = !!firebaseUid && !!customer

  return (
    <CustomerContext.Provider value={{
      firebaseUid,
      customer,
      loading,
      refreshSession,
      signOut,
      isAuthenticated
    }}>
      {children}
    </CustomerContext.Provider>
  )
}

/**
 * Hook to access customer context
 */
export function useCustomer() {
  const context = useContext(CustomerContext)
  if (context === undefined) {
    throw new Error('useCustomer must be used within a CustomerProvider')
  }
  return context
}

/**
 * Hook to require authentication - redirects to auth page if not authenticated
 */
export function useRequireCustomerAuth(returnUrl?: string) {
  const { firebaseUid, loading, isAuthenticated } = useCustomer()
  
  useEffect(() => {
    if (!loading && !firebaseUid) {
      const currentUrl = returnUrl || (typeof window !== 'undefined' ? window.location.href : '/')
      window.location.href = `/auth?returnUrl=${encodeURIComponent(currentUrl)}`
    }
  }, [loading, firebaseUid, returnUrl])
  
  return { loading, isAuthenticated }
}
