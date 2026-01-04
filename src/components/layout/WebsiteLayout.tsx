'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, Search, ShoppingBag, User, ChevronDown } from 'lucide-react'
import { cn, getImageUrl } from '@/lib/utils'
import { Category, Collection } from '@/types/database'

interface WebsiteLayoutProps {
  children: React.ReactNode
  user: {
    id: string
    shop_name: string | null
    logo_url: string | null
    shop_domain: string | null
  }
  theme: 'light' | 'dark'
  categories: Category[]
  collections: Collection[]
}

export default function WebsiteLayout({ 
  children, 
  user, 
  theme,
  categories,
  collections 
}: WebsiteLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  const isDark = theme === 'dark'

  useEffect(() => {
    document.body.className = theme
  }, [theme])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { label: 'Collections', href: '/collections', items: collections },
    { label: 'Categories', href: '/categories', items: categories },
    { label: 'New Arrivals', href: '/products?sort=newest' },
    { label: 'Contact', href: '/contact' },
  ]

  return (
    <div className={cn(
      'min-h-screen',
      isDark ? 'bg-[#080808] text-white' : 'bg-offwhite text-black'
    )}>
      {/* Navigation */}
      <header className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled 
          ? isDark 
            ? 'bg-black/90 backdrop-blur-md shadow-lg' 
            : 'bg-white/90 backdrop-blur-md shadow-lg'
          : 'bg-transparent'
      )}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href={`/${user.shop_domain}`} className="flex items-center gap-3">
              {user.logo_url ? (
                <Image
                  src={getImageUrl(user.logo_url)}
                  alt={user.shop_name || 'Store'}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-display text-lg',
                  isDark ? 'bg-gold-500 text-black' : 'bg-gold-500 text-white'
                )}>
                  {user.shop_name?.charAt(0) || 'S'}
                </div>
              )}
              <span className="font-display text-xl font-semibold hidden sm:block">
                {user.shop_name || 'Store'}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => item.items && setActiveDropdown(item.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    href={`/${user.shop_domain}${item.href}`}
                    className={cn(
                      'flex items-center gap-1 text-sm font-medium tracking-wide transition-colors',
                      isDark ? 'hover:text-gold-400' : 'hover:text-gold-600'
                    )}
                  >
                    {item.label}
                    {item.items && <ChevronDown className="w-4 h-4" />}
                  </Link>

                  {/* Dropdown Menu */}
                  {item.items && activeDropdown === item.label && (
                    <div className={cn(
                      'absolute top-full left-0 mt-2 w-64 rounded-lg shadow-xl py-2 animate-slide-down',
                      isDark ? 'bg-zinc-900' : 'bg-white'
                    )}>
                      {item.items.map((subItem) => (
                        <Link
                          key={subItem.id}
                          href={`/${user.shop_domain}${item.href}/${subItem.name.toLowerCase().replace(/\s+/g, '-')}`}
                          className={cn(
                            'block px-4 py-2 text-sm transition-colors',
                            isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-50'
                          )}
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              <button className={cn(
                'p-2 transition-colors',
                isDark ? 'hover:text-gold-400' : 'hover:text-gold-600'
              )}>
                <Search className="w-5 h-5" />
              </button>
              <button className={cn(
                'p-2 transition-colors',
                isDark ? 'hover:text-gold-400' : 'hover:text-gold-600'
              )}>
                <User className="w-5 h-5" />
              </button>
              <button className={cn(
                'p-2 transition-colors relative',
                isDark ? 'hover:text-gold-400' : 'hover:text-gold-600'
              )}>
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold-500 text-white text-xs rounded-full flex items-center justify-center">
                  0
                </span>
              </button>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className={cn(
            'md:hidden absolute top-full left-0 right-0 shadow-xl animate-slide-down',
            isDark ? 'bg-zinc-900' : 'bg-white'
          )}>
            <div className="px-4 py-4 space-y-4">
              {navItems.map((item) => (
                <div key={item.label}>
                  <Link
                    href={`/${user.shop_domain}${item.href}`}
                    className="block py-2 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                  {item.items && (
                    <div className="pl-4 space-y-2">
                      {item.items.slice(0, 5).map((subItem) => (
                        <Link
                          key={subItem.id}
                          href={`/${user.shop_domain}${item.href}/${subItem.name.toLowerCase().replace(/\s+/g, '-')}`}
                          className={cn(
                            'block py-1 text-sm',
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          )}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="pt-16 md:pt-20">
        {children}
      </main>
    </div>
  )
}
