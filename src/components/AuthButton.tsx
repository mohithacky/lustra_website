'use client'

import { useAuth } from '@/contexts/AuthContext'
import { LogIn, LogOut, Loader2 } from 'lucide-react'

export default function AuthButton() {
  const { user, loading, signOut, redirectToAuth } = useAuth()

  if (loading) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading...
      </button>
    )
  }

  if (user) {
    return (
      <button
        onClick={signOut}
        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    )
  }

  return (
    <button
      onClick={redirectToAuth}
      className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
    >
      <LogIn className="h-4 w-4" />
      Sign In
    </button>
  )
}
