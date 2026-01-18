'use client'

import { useState, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function LoadingIndicator() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  
  // Track navigation events to show loading indicator
  useEffect(() => {
    const handleStart = () => setIsLoading(true)
    const handleStop = () => {
      setTimeout(() => setIsLoading(false), 300) // Small delay for smoother transitions
    }

    // Add event listeners for navigation
    window.addEventListener('beforeunload', handleStart)
    window.addEventListener('load', handleStop)

    return () => {
      window.removeEventListener('beforeunload', handleStart)
      window.removeEventListener('load', handleStop)
    }
  }, [])
  
  // Also track Next.js router changes
  useEffect(() => {
    setIsLoading(false)
  }, [pathname, searchParams])

  if (!isLoading) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1">
      <div className="h-full w-full bg-gold-500 animate-pulse" />
      <div 
        className="h-full bg-gold-500 animate-progressBar" 
        style={{
          width: '100%',
          animation: 'progressAnimation 2s ease-in-out infinite'
        }}
      />
      
      <style jsx global>{`
        @keyframes progressAnimation {
          0% {
            width: 0%;
          }
          50% {
            width: 70%;
          }
          100% {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}
