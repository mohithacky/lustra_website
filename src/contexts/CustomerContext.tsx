'use client'

/**
 * Customer Context - Persists customer session data throughout the website
 * 
 * This context manages customer-specific data (from customers table) after
 * Firebase phone authentication. It automatically fetches customer data
 * when a Firebase user is authenticated.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase'
import { getCurrentCustomer, CustomerData } from '@/lib/customerApi'

interface CustomerContextType {
  // Firebase user
  firebaseUser: FirebaseUser | null
  // Customer data from Supabase (fetched via backend)
  customer: CustomerData | null
  // Loading states
  loading: boolean
  customerLoading: boolean
  // Methods
  refreshCustomer: () => Promise<void>
  signOut: () => Promise<void>
  // Helper to check if customer is fully authenticated
  isAuthenticated: boolean
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined)

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [customer, setCustomer] = useState<CustomerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [customerLoading, setCustomerLoading] = useState(false)

  // Fetch customer data from backend
  const fetchCustomerData = useCallback(async (user: FirebaseUser) => {
    try {
      setCustomerLoading(true)
      console.log('[CustomerContext] Fetching customer data for:', user.uid)
      
      const idToken = await user.getIdToken()
      const customerData = await getCurrentCustomer(idToken)
      
      if (customerData) {
        console.log('[CustomerContext] Customer data loaded:', customerData.id)
        setCustomer(customerData)
        
        // Also store in localStorage for persistence across page reloads
        localStorage.setItem('customerData', JSON.stringify({
          ...customerData,
          timestamp: Date.now()
        }))
      } else {
        console.log('[CustomerContext] No customer data found')
        setCustomer(null)
        localStorage.removeItem('customerData')
      }
    } catch (error) {
      console.error('[CustomerContext] Error fetching customer:', error)
      setCustomer(null)
    } finally {
      setCustomerLoading(false)
    }
  }, [])

  // Refresh customer data manually
  const refreshCustomer = useCallback(async () => {
    if (firebaseUser) {
      await fetchCustomerData(firebaseUser)
    }
  }, [firebaseUser, fetchCustomerData])

  // Sign out
  const signOut = useCallback(async () => {
    const auth = getFirebaseAuth()
    if (auth) {
      await auth.signOut()
    }
    setFirebaseUser(null)
    setCustomer(null)
    localStorage.removeItem('customerData')
    localStorage.removeItem('firebaseAuth')
    console.log('[CustomerContext] Signed out')
  }, [])

  // Listen to Firebase auth state changes
  useEffect(() => {
    const auth = getFirebaseAuth()
    if (!auth) {
      setLoading(false)
      return
    }

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

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('[CustomerContext] Auth state changed:', user ? user.uid : 'signed out')
      
      setFirebaseUser(user)
      setLoading(false)
      
      if (user) {
        // Fetch fresh customer data when user signs in
        await fetchCustomerData(user)
      } else {
        // Clear customer data when user signs out
        setCustomer(null)
        localStorage.removeItem('customerData')
      }
    })

    return () => unsubscribe()
  }, [fetchCustomerData])

  const isAuthenticated = !!firebaseUser && !!customer

  return (
    <CustomerContext.Provider value={{
      firebaseUser,
      customer,
      loading,
      customerLoading,
      refreshCustomer,
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
  const { firebaseUser, loading, isAuthenticated } = useCustomer()
  
  useEffect(() => {
    if (!loading && !firebaseUser) {
      const currentUrl = returnUrl || (typeof window !== 'undefined' ? window.location.href : '/')
      window.location.href = `/auth?returnUrl=${encodeURIComponent(currentUrl)}`
    }
  }, [loading, firebaseUser, returnUrl])
  
  return { loading, isAuthenticated }
}
