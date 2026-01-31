'use client'

import { useAuth } from '@/contexts/AuthContext'
import { LogIn, LogOut, Loader2 } from 'lucide-react'
import { useState } from 'react'

export default function DebugAuthButton() {
  const { user, loading, signOut, redirectToAuth } = useAuth()
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  
  const handleRedirectClick = () => {
    try {
      console.log('[Debug] Redirect button clicked')
      const currentUrl = window.location.href
      console.log('[Debug] Current URL:', currentUrl)
      
      // Show debug info
      setDebugInfo(`Redirecting to /auth with returnUrl=${currentUrl}`)
      
      // Use direct navigation instead of context function
      window.location.href = `/auth?returnUrl=${encodeURIComponent(currentUrl)}`
    } catch (error) {
      console.error('[Debug] Error in redirect:', error)
      setDebugInfo(`Error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col">
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed mb-2"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </button>
        
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="text-xs text-blue-500 underline"
        >
          {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
        </button>
        
        {showDebug && (
          <div className="mt-2 p-2 bg-gray-100 text-xs font-mono rounded">
            Auth Status: Loading
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {user ? (
        <button
          onClick={signOut}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors mb-2"
        >
          <LogOut className="h-4 w-4" />
          Sign Out (Debug)
        </button>
      ) : (
        <button
          onClick={handleRedirectClick}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors mb-2"
        >
          <LogIn className="h-4 w-4" />
          Sign In (Debug)
        </button>
      )}
      
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="text-xs text-blue-500 underline"
      >
        {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
      </button>
      
      {showDebug && (
        <div className="mt-2 p-2 bg-gray-100 text-xs font-mono rounded">
          <div>Auth Status: {user ? 'Logged In' : 'Logged Out'}</div>
          <div>User ID: {user?.uid || 'None'}</div>
          <div>Phone: {user?.phoneNumber || 'None'}</div>
          {debugInfo && <div className="text-red-500">{debugInfo}</div>}
        </div>
      )}
    </div>
  )
}
