'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AuthTestPage() {
  const router = useRouter()
  const [message, setMessage] = useState('')
  
  const handleDirectNavigation = () => {
    try {
      setMessage('Navigating to /auth...')
      window.location.href = '/auth?returnUrl=/auth-test'
    } catch (error) {
      setMessage(`Navigation error: ${error}`)
    }
  }
  
  const handleRouterNavigation = () => {
    try {
      setMessage('Using Next.js router to navigate...')
      router.push('/auth?returnUrl=/auth-test')
    } catch (error) {
      setMessage(`Router navigation error: ${error}`)
    }
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">Authentication Navigation Test</h1>
      
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-4">Navigation Methods</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">1. Direct URL Navigation</h3>
            <a 
              href="/auth?returnUrl=/auth-test" 
              className="block w-full py-2 px-4 bg-blue-600 text-white rounded-md text-center hover:bg-blue-700 transition-colors"
            >
              Navigate with href
            </a>
            <p className="mt-2 text-xs text-gray-500">
              Uses standard anchor tag navigation
            </p>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">2. window.location Navigation</h3>
            <button 
              onClick={handleDirectNavigation}
              className="block w-full py-2 px-4 bg-green-600 text-white rounded-md text-center hover:bg-green-700 transition-colors"
            >
              Navigate with window.location
            </button>
            <p className="mt-2 text-xs text-gray-500">
              This is what the AuthButton uses (redirectToAuth)
            </p>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">3. Next.js Router Navigation</h3>
            <button 
              onClick={handleRouterNavigation}
              className="block w-full py-2 px-4 bg-amber-600 text-white rounded-md text-center hover:bg-amber-700 transition-colors"
            >
              Navigate with router.push
            </button>
            <p className="mt-2 text-xs text-gray-500">
              Uses the Next.js router for client-side navigation
            </p>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">4. Link Component</h3>
            <Link 
              href="/auth?returnUrl=/auth-test" 
              className="block w-full py-2 px-4 bg-purple-600 text-white rounded-md text-center hover:bg-purple-700 transition-colors"
            >
              Navigate with Next.js Link
            </Link>
            <p className="mt-2 text-xs text-gray-500">
              Uses Next.js Link component for client-side navigation
            </p>
          </div>
          
          {message && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
              {message}
            </div>
          )}
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-100">
          <h3 className="font-medium mb-2">Current URL Information</h3>
          <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
            {`URL: ${typeof window !== 'undefined' ? window.location.href : 'N/A'}
Pathname: ${typeof window !== 'undefined' ? window.location.pathname : 'N/A'}`}
          </pre>
          
          <div className="mt-4">
            <Link 
              href="/" 
              className="text-blue-600 hover:underline"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
