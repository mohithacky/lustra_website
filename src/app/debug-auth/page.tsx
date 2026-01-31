'use client'

import { useEffect, useState } from 'react'
import DebugAuthButton from '@/components/DebugAuthButton'
import { initializeFirebase } from '@/lib/firebase'

export default function DebugAuthPage() {
  const [firebaseInitialized, setFirebaseInitialized] = useState(false)
  
  useEffect(() => {
    try {
      const { app, auth } = initializeFirebase()
      setFirebaseInitialized(true)
      console.log('[Debug] Firebase initialized successfully', { app, auth })
    } catch (error) {
      console.error('[Debug] Firebase initialization error:', error)
    }
  }, [])
  
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">Auth Debug Page</h1>
      
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-4">Firebase Status</h2>
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-3 h-3 rounded-full ${firebaseInitialized ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>{firebaseInitialized ? 'Firebase Initialized' : 'Firebase Not Initialized'}</span>
        </div>
        
        <h2 className="text-xl font-semibold mb-4">Navigation Test</h2>
        <p className="mb-4 text-sm text-gray-700">
          This button should redirect you to the auth page. If it doesn't work, check console for errors.
        </p>
        
        <div className="mb-6">
          <DebugAuthButton />
        </div>
        
        <h2 className="text-xl font-semibold mb-4">Direct Links</h2>
        <div className="space-y-2">
          <a href="/auth" className="block text-blue-600 hover:underline">
            Direct link to /auth
          </a>
          <a href="/auth?returnUrl=%2Fdebug-auth" className="block text-blue-600 hover:underline">
            Direct link to /auth with returnUrl
          </a>
          <button 
            onClick={() => { window.location.href = "/auth" }}
            className="text-blue-600 hover:underline"
          >
            JS Navigation to /auth
          </button>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-100">
          <h3 className="font-medium mb-2">Browser Information</h3>
          <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
            {`URL: ${typeof window !== 'undefined' ? window.location.href : 'N/A'}
Pathname: ${typeof window !== 'undefined' ? window.location.pathname : 'N/A'}
UserAgent: ${typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'}`}
          </pre>
        </div>
      </div>
    </div>
  )
}
