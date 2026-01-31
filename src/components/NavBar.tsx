'use client'

import AuthButton from '@/components/AuthButton'
import Link from 'next/link'

export default function NavBar() {
  return (
    <nav className="w-full flex justify-between items-center mb-12">
      <div className="flex-1">
        <Link href="/" className="font-display text-2xl font-bold text-gray-900 hover:text-amber-600 transition-colors">
          Lustra
        </Link>
      </div>
      
      <div className="flex gap-4 items-center">
        <Link 
          href="/debug-auth" 
          className="text-sm text-gray-600 hover:text-amber-600 transition-colors"
        >
          Debug Auth
        </Link>
        <Link 
          href="/profile" 
          className="text-sm text-gray-600 hover:text-amber-600 transition-colors"
        >
          Profile
        </Link>
        <AuthButton />
      </div>
    </nav>
  )
}
