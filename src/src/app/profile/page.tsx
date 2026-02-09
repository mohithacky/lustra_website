'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useSupabase } from '@/hooks/useSupabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface UserData {
  id: string
  phone_number: string
  shop_name: string | null
  shop_details_filled: boolean
  coins: number
  created_at: string
}

export default function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const supabase = useSupabase()
  const router = useRouter()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push('/auth?returnUrl=' + encodeURIComponent(window.location.href))
      return
    }

    fetchUserData()
  }, [user, authLoading, router])

  async function fetchUserData() {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.uid)
        .single()

      if (error) {
        console.error('Error fetching user data:', error)
        setError('Failed to load profile data')
      } else {
        setUserData(data)
      }
    } catch (err) {
      console.error('Error:', err)
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    await signOut()
    router.push('/')
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-medium text-gray-500 mb-1">Phone Number</h2>
              <p className="text-lg text-gray-900">{user.phoneNumber || 'Not available'}</p>
            </div>

            <div>
              <h2 className="text-sm font-medium text-gray-500 mb-1">User ID</h2>
              <p className="text-sm text-gray-700 font-mono bg-gray-100 p-2 rounded">
                {user.uid}
              </p>
            </div>

            {userData && (
              <>
                <div>
                  <h2 className="text-sm font-medium text-gray-500 mb-1">Shop Name</h2>
                  <p className="text-lg text-gray-900">
                    {userData.shop_name || 'Not set'}
                  </p>
                </div>

                <div>
                  <h2 className="text-sm font-medium text-gray-500 mb-1">Shop Details</h2>
                  <p className="text-lg text-gray-900">
                    {userData.shop_details_filled ? (
                      <span className="text-green-600">✓ Completed</span>
                    ) : (
                      <span className="text-amber-600">⚠ Incomplete</span>
                    )}
                  </p>
                </div>

                <div>
                  <h2 className="text-sm font-medium text-gray-500 mb-1">Coins</h2>
                  <p className="text-lg text-gray-900">{userData.coins || 0}</p>
                </div>

                <div>
                  <h2 className="text-sm font-medium text-gray-500 mb-1">Member Since</h2>
                  <p className="text-lg text-gray-900">
                    {new Date(userData.created_at).toLocaleDateString()}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Authentication Status</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Authenticated via Firebase</span>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            🔐 This is a protected page
          </h3>
          <p className="text-sm text-blue-800">
            This page demonstrates Firebase authentication with Supabase database access.
            The user data is fetched from Supabase using Firebase ID token for authentication.
          </p>
        </div>
      </div>
    </div>
  )
}
