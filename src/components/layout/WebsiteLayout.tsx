'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, Search, Heart, ShoppingCart, ChevronDown, LogIn } from 'lucide-react'
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
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  const isDark = theme === 'dark'
  const shopDomain = user.shop_domain || ''

  useEffect(() => {
    document.body.className = theme
  }, [theme])

  // Navigation items matching Flutter AppBar
  const navItems = [
    { label: 'Collections', key: 'collections', items: collections.map(c => ({ name: c.name, href: `/collections/${c.name.toLowerCase().replace(/\s+/g, '-')}` })) },
    { label: 'Categories', key: 'categories', items: categories.map(c => ({ name: c.name, href: `/categories/${c.name.toLowerCase().replace(/\s+/g, '-')}` })) },
  ]

  return (
    <div className={cn(
      'min-h-screen',
      isDark ? 'bg-[#080808] text-white' : 'bg-offwhite text-black'
    )}>
      {/* Navigation - matches Flutter SliverAppBar */}
      <header className={cn(
        'sticky top-0 z-50',
        isDark ? 'bg-[#121212]' : 'bg-white'
      )}>
        <nav className="px-4">
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* Left: Menu Button (Mobile) */}
            <button
              className="p-2 md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Center: Logo + Shop Name - matches Flutter centerTitle */}
            <Link href={`/`} className="flex items-center gap-2 mx-auto md:mx-0">
              {user.logo_url && (
                <Image
                  src={getImageUrl(user.logo_url)}
                  alt={user.shop_name || 'Store'}
                  width={32}
                  height={32}
                  className="rounded-full object-cover"
                />
              )}
              <span className={cn(
                'font-display text-lg md:text-xl font-bold tracking-wide',
                isDark ? 'text-white' : 'text-black'
              )}>
                {user.shop_name || 'YOUR BRAND'}
              </span>
            </Link>

            {/* Desktop Navigation Items - matches Flutter topNavItems */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <div
                  key={item.key}
                  className="relative"
                  onMouseEnter={() => item.items.length > 0 && setActiveDropdown(item.key)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <button
                    className={cn(
                      'flex items-center gap-1 px-3 py-2 text-sm font-semibold transition-colors',
                      isDark ? 'text-white hover:text-gold-400' : 'text-black hover:text-gold-600'
                    )}
                  >
                    {item.label}
                    <ChevronDown className="w-4 h-4 opacity-60" />
                  </button>

                  {/* Dropdown Menu - matches Flutter mega menu */}
                  {item.items.length > 0 && activeDropdown === item.key && (
                    <div className={cn(
                      'absolute top-full left-0 mt-0 min-w-[200px] rounded-lg shadow-xl py-2 z-50',
                      isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-100'
                    )}>
                      {item.items.map((subItem) => (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className={cn(
                            'block px-4 py-2.5 text-sm font-medium transition-colors',
                            isDark ? 'text-gray-300 hover:bg-zinc-800 hover:text-white' : 'text-gray-700 hover:bg-gray-50 hover:text-black'
                          )}
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Login Button - matches Flutter canShowCustomerLogin */}
              <button className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-sm font-semibold transition-colors',
                isDark ? 'text-white hover:text-gold-400' : 'text-black hover:text-gold-600'
              )}>
                <LogIn className="w-5 h-5" />
                <span>Login</span>
              </button>
            </div>

            {/* Right Actions - matches Flutter actions */}
            <div className="flex items-center gap-1">
              {/* Search */}
              <Link
                href={`/products`}
                className={cn(
                  'p-2 transition-colors',
                  isDark ? 'hover:text-gold-400' : 'hover:text-gold-600'
                )}
              >
                <Search className="w-5 h-5" />
              </Link>
              
              {/* Wishlist - matches Flutter favorite_border icon */}
              <button className={cn(
                'p-2 transition-colors',
                isDark ? 'hover:text-gold-400' : 'hover:text-gold-600'
              )}>
                <Heart className="w-5 h-5" />
              </button>
              
              {/* Cart - matches Flutter shopping_cart_outlined icon */}
              <button className={cn(
                'p-2 transition-colors',
                isDark ? 'hover:text-gold-400' : 'hover:text-gold-600'
              )}>
                <ShoppingCart className="w-5 h-5" />
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Menu - matches Flutter drawer */}
        {isMenuOpen && (
          <div className={cn(
            'md:hidden fixed inset-0 z-50',
          )}>
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsMenuOpen(false)}
            />
            
            {/* Drawer */}
            <div className={cn(
              'absolute top-0 left-0 bottom-0 w-72 shadow-xl overflow-y-auto',
              isDark ? 'bg-zinc-900' : 'bg-white'
            )}>
              {/* Drawer Header */}
              <div className={cn(
                'flex items-center justify-between p-4 border-b',
                isDark ? 'border-zinc-800' : 'border-gray-100'
              )}>
                <div className="flex items-center gap-2">
                  {user.logo_url && (
                    <Image
                      src={getImageUrl(user.logo_url)}
                      alt={user.shop_name || 'Store'}
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                  )}
                  <span className="font-display text-lg font-bold">
                    {user.shop_name || 'Store'}
                  </span>
                </div>
                <button onClick={() => setIsMenuOpen(false)} className="p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-4 space-y-4">
                {/* Home Link */}
                <Link
                  href={`/`}
                  className="block py-2 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>

                {/* Collections */}
                <div>
                  <div className={cn(
                    'py-2 font-semibold text-sm uppercase tracking-wide',
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  )}>
                    Collections
                  </div>
                  <div className="space-y-1">
                    {collections.slice(0, 8).map((collection) => (
                      <Link
                        key={collection.id}
                        href={`/collections/${collection.name.toLowerCase().replace(/\s+/g, '-')}`}
                        className={cn(
                          'block py-2 text-sm',
                          isDark ? 'text-gray-300' : 'text-gray-600'
                        )}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {collection.name}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <div className={cn(
                    'py-2 font-semibold text-sm uppercase tracking-wide',
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  )}>
                    Categories
                  </div>
                  <div className="space-y-1">
                    {categories.slice(0, 8).map((category) => (
                      <Link
                        key={category.id}
                        href={`/categories/${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                        className={cn(
                          'block py-2 text-sm',
                          isDark ? 'text-gray-300' : 'text-gray-600'
                        )}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* All Products */}
                <Link
                  href={`/products`}
                  className="block py-2 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  All Products
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  )
}
