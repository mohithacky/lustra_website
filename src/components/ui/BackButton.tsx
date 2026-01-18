'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BackButtonProps {
  className?: string
  isDark?: boolean
}

export default function BackButton({ className, isDark = false }: BackButtonProps) {
  const router = useRouter()
  
  return (
    <button
      onClick={() => router.back()}
      className={cn(
        'flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors text-sm font-medium',
        isDark 
          ? 'bg-zinc-800 text-white hover:bg-zinc-700' 
          : 'bg-white text-black border border-gray-200 hover:bg-gray-50',
        className
      )}
      aria-label="Go back"
    >
      <ArrowLeft className="w-4 h-4" />
      Back
    </button>
  )
}
