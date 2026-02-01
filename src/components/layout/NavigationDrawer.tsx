'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, User, LogOut, Home, Grid, Tag, TrendingUp, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Category, Collection } from '@/types/database'

interface NavigationDrawerProps {
  isOpen: boolean
  onClose: () => void
  isDark: boolean
  customer: {
    id: string
    name?: string
    phone: string
  } | null
  onLogout: () => void
  onLoginClick: () => void
  categories: Category[]
  collections: Collection[]
  shopDomain: string
}

export default function NavigationDrawer({
  isOpen,
  onClose,
  isDark,
  customer,
  onLogout,
  onLoginClick,
  categories,
  collections,
  shopDomain,
}: NavigationDrawerProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!mounted) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-50 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 left-0 h-full w-[85vw] max-w-[400px] z-50 transition-transform duration-300 ease-in-out overflow-y-auto',
          isDark ? 'bg-[#121212]' : 'bg-white',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className={cn(
          'sticky top-0 z-10 flex items-center justify-between p-4 border-b',
          isDark ? 'bg-[#121212] border-white/10' : 'bg-white border-black/10'
        )}>
          <h2 className={cn(
            'text-lg font-bold',
            isDark ? 'text-white' : 'text-black'
          )}>
            Menu
          </h2>
          <button
            onClick={onClose}
            className={cn(
              'p-2 rounded-full transition-colors',
              isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
            )}
          >
            <X className={cn(
              'w-5 h-5',
              isDark ? 'text-white' : 'text-black'
            )} />
          </button>
        </div>

        {/* User Section */}
        <div className={cn(
          'p-4 border-b',
          isDark ? 'border-white/10' : 'border-black/10'
        )}>
          {customer ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center',
                  isDark ? 'bg-gold-500/20' : 'bg-gold-500/10'
                )}>
                  <User className={cn(
                    'w-6 h-6',
                    isDark ? 'text-gold-400' : 'text-gold-600'
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'font-semibold truncate',
                    isDark ? 'text-white' : 'text-black'
                  )}>
                    {customer.name || 'Customer'}
                  </p>
                  <p className={cn(
                    'text-sm truncate',
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    {customer.phone}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  onLogout()
                  onClose()
                }}
                className={cn(
                  'w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                  isDark 
                    ? 'bg-white/10 text-white hover:bg-white/20' 
                    : 'bg-black/5 text-black hover:bg-black/10'
                )}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          ) : (
            <a
              href={typeof window !== 'undefined'
                ? `https://lustrai.in/auth?returnUrl=${encodeURIComponent(
                    `${window.location.protocol}//${window.location.host}${window.location.pathname}${window.location.search}`
                  )}`
                : `https://lustrai.in/auth`
              }
              onClick={onClose}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors',
                isDark 
                  ? 'bg-gold-500 text-black hover:bg-gold-600' 
                  : 'bg-gold-500 text-white hover:bg-gold-600'
              )}
            >
              <User className="w-5 h-5" />
              Login / Sign Up
            </a>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="p-4 space-y-3">
          {/* Home Section */}
          <div>
            <Link
              href="/"
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
              )}
            >
              <Home className={cn(
                'w-5 h-5',
                isDark ? 'text-gold-400' : 'text-gold-600'
              )} />
              <span className={cn(
                'font-semibold',
                isDark ? 'text-white' : 'text-black'
              )}>
                Home
              </span>
            </Link>
          </div>

          {/* Hero Carousel Collections */}
          <div>
            <div className="flex items-center gap-2 px-3 mb-1">
              <Sparkles className={cn(
                'w-4 h-4',
                isDark ? 'text-gold-400' : 'text-gold-600'
              )} />
              <h3 className={cn(
                'text-sm font-bold uppercase tracking-wide',
                isDark ? 'text-gray-400' : 'text-gray-600'
              )}>
                Featured Collections
              </h3>
            </div>
            <div className="space-y-1">
              {collections.slice(0, 5).map((collection) => (
                <Link
                  key={collection.id}
                  href={`/products?collection=${encodeURIComponent(collection.name)}`}
                  onClick={onClose}
                  className={cn(
                    'block px-3 py-2 rounded-lg transition-colors',
                    isDark 
                      ? 'text-gray-300 hover:bg-white/10 hover:text-white' 
                      : 'text-gray-700 hover:bg-black/5 hover:text-black'
                  )}
                >
                  {collection.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Categories Section */}
          <div>
            <div className="flex items-center gap-2 px-3 mb-1">
              <Grid className={cn(
                'w-4 h-4',
                isDark ? 'text-gold-400' : 'text-gold-600'
              )} />
              <h3 className={cn(
                'text-sm font-bold uppercase tracking-wide',
                isDark ? 'text-gray-400' : 'text-gray-600'
              )}>
                Shop by Category
              </h3>
            </div>
            <div className="space-y-1">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/products?category=${encodeURIComponent(category.name)}`}
                  onClick={onClose}
                  className={cn(
                    'block px-3 py-2 rounded-lg transition-colors',
                    isDark 
                      ? 'text-gray-300 hover:bg-white/10 hover:text-white' 
                      : 'text-gray-700 hover:bg-black/5 hover:text-black'
                  )}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Product Types Section */}
          <div>
            <div className="flex items-center gap-2 px-3 mb-1">
              <Tag className={cn(
                'w-4 h-4',
                isDark ? 'text-gold-400' : 'text-gold-600'
              )} />
              <h3 className={cn(
                'text-sm font-bold uppercase tracking-wide',
                isDark ? 'text-gray-400' : 'text-gray-600'
              )}>
                Shop by Product Type
              </h3>
            </div>
            <div className="space-y-1">
              {['Rings', 'Necklaces', 'Earrings', 'Bracelets', 'Bangles', 'Pendants'].map((type) => (
                <Link
                  key={type}
                  href={`/products?type=${encodeURIComponent(type)}`}
                  onClick={onClose}
                  className={cn(
                    'block px-3 py-2 rounded-lg transition-colors',
                    isDark 
                      ? 'text-gray-300 hover:bg-white/10 hover:text-white' 
                      : 'text-gray-700 hover:bg-black/5 hover:text-black'
                  )}
                >
                  {type}
                </Link>
              ))}
            </div>
          </div>

          {/* Trending Collections */}
          <div>
            <div className="flex items-center gap-2 px-3 mb-1">
              <TrendingUp className={cn(
                'w-4 h-4',
                isDark ? 'text-gold-400' : 'text-gold-600'
              )} />
              <h3 className={cn(
                'text-sm font-bold uppercase tracking-wide',
                isDark ? 'text-gray-400' : 'text-gray-600'
              )}>
                Trending Collections
              </h3>
            </div>
            <div className="space-y-1">
              {collections.slice(0, 3).map((collection) => (
                <Link
                  key={`trending-${collection.id}`}
                  href={`/products?collection=${encodeURIComponent(collection.name)}`}
                  onClick={onClose}
                  className={cn(
                    'block px-3 py-2 rounded-lg transition-colors',
                    isDark 
                      ? 'text-gray-300 hover:bg-white/10 hover:text-white' 
                      : 'text-gray-700 hover:bg-black/5 hover:text-black'
                  )}
                >
                  {collection.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
