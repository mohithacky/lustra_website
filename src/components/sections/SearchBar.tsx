'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  isDark?: boolean
  shopDomain: string
}

export default function SearchBar({ isDark = false, shopDomain }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isExpanded])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const query = searchQuery.trim()
    if (!query) return

    // Navigate to products page with search query
    router.push(`/products?search=${encodeURIComponent(query)}`)
    setIsExpanded(false)
  }

  const handleIconClick = () => {
    if (!isExpanded) {
      setIsExpanded(true)
    }
  }

  const handleClose = () => {
    setIsExpanded(false)
    setSearchQuery('')
  }

  return (
    <form onSubmit={handleSearch} className="w-full">
      {/* Mobile: Icon only, expands on click */}
      <div className="md:hidden flex justify-end">
        {!isExpanded ? (
          <button
            type="button"
            onClick={handleIconClick}
            className={cn(
              'p-2 rounded-full transition-colors',
              isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
            )}
          >
            <Search className={cn(
              'w-5 h-5',
              isDark ? 'text-white/70' : 'text-black/54'
            )} />
          </button>
        ) : (
          <div className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all animate-in slide-in-from-right duration-300 w-full',
            isDark 
              ? 'bg-white/[0.06] border-white/[0.18]' 
              : 'bg-white border-black/[0.08] shadow-sm',
          )}>
            <Search className={cn(
              'w-5 h-5 flex-shrink-0',
              isDark ? 'text-white/70' : 'text-black/54'
            )} />
            
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className={cn(
                'flex-1 bg-transparent outline-none text-sm min-w-0',
                isDark ? 'text-white placeholder:text-white/60' : 'text-black placeholder:text-black/45'
              )}
            />

            <button
              type="button"
              onClick={handleClose}
              className={cn(
                'p-1 rounded-full transition-colors',
                isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
              )}
            >
              <X className={cn(
                'w-4 h-4',
                isDark ? 'text-white/70' : 'text-black/54'
              )} />
            </button>
          </div>
        )}
      </div>

      {/* Desktop: Always show full search bar */}
      <div className="hidden md:block">
        <div className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all',
          isDark 
            ? 'bg-white/[0.06] border-white/[0.18]' 
            : 'bg-white border-black/[0.08] shadow-sm hover:shadow-md',
        )}>
          <Search className={cn(
            'w-5 h-5 flex-shrink-0',
            isDark ? 'text-white/70' : 'text-black/54'
          )} />
          
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for jewellery, categories, collections..."
            className={cn(
              'flex-1 bg-transparent outline-none text-sm',
              isDark ? 'text-white placeholder:text-white/60' : 'text-black placeholder:text-black/45'
            )}
          />

          {isSearching ? (
            <div className="flex-shrink-0 px-3">
              <div className={cn(
                'w-4 h-4 border-2 border-t-transparent rounded-full animate-spin',
                isDark ? 'border-gold-400' : 'border-black'
              )} />
            </div>
          ) : (
            <button
              type="submit"
              disabled={!searchQuery.trim()}
              className={cn(
                'flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                isDark 
                  ? 'text-gold-400 hover:bg-white/10' 
                  : 'text-black hover:bg-black/5'
              )}
            >
              Search
            </button>
          )}
        </div>
      </div>
    </form>
  )
}
