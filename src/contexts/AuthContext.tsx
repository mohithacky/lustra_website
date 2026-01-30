'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase'

interface AuthContextType {
  user: FirebaseUser | null
  loading: boolean
  signOut: () => Promise<void>
  redirectToAuth: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const auth = getFirebaseAuth()
    if (!auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
      
      if (firebaseUser) {
        console.log('[Auth] User signed in:', firebaseUser.uid)
      } else {
        console.log('[Auth] No user signed in')
      }
    })

    return () => unsubscribe()
  }, [])

  const signOut = async () => {
    const auth = getFirebaseAuth()
    if (auth) {
      await auth.signOut()
      setUser(null)
    }
  }

  const redirectToAuth = () => {
    const currentUrl = window.location.href
    const authUrl = `/auth?returnUrl=${encodeURIComponent(currentUrl)}`
    window.location.href = authUrl
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut, redirectToAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
