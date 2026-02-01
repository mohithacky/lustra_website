'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Search, Heart, ShoppingCart, ChevronDown, LogIn, LogOut, User, Menu } from 'lucide-react'
import { cn, getImageUrl } from '@/lib/utils'
import { Category, Collection } from '@/types/database'
import FirebasePhoneLoginDialog from '@/components/auth/FirebasePhoneLoginDialog'
import { FirebaseAuthResult } from '@/lib/firebaseAuth'
import EditorProvider from '@/components/editor/EditorProvider'
import AnnouncementBar from '@/components/sections/AnnouncementBar'
import { PromotionalAnnouncement } from '@/lib/supabase-new-architecture'
import BackButton from '@/components/ui/BackButton'
import LoadingIndicator from '@/components/ui/LoadingIndicator'
import SearchBar from '@/components/sections/SearchBar'
import NavigationDrawer from '@/components/layout/NavigationDrawer'

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
  announcements?: PromotionalAnnouncement[]
  announcementBarConfig?: Record<string, any>
  shopDomain: string
}

interface CustomerSession {
  id: string
  name?: string
  phone: string
  shopId: string
}

export default function WebsiteLayout({ 
  children, 
  user, 
  theme,
  categories,
  collections,
  announcements = [],
  announcementBarConfig = {},
  shopDomain,
}: WebsiteLayoutProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)
  const [customer, setCustomer] = useState<CustomerSession | null>(null)
  const [logoError, setLogoError] = useState(false)
  const pathname = usePathname()

  const isDark = theme === 'dark'

  // Load customer from localStorage on mount
  useEffect(() => {
    // Try Firebase auth first
    const firebaseAuth = localStorage.getItem('firebaseAuth')
    if (firebaseAuth) {
      try {
        const parsed = JSON.parse(firebaseAuth)
        if (parsed.shopId === user.id) {
          setCustomer({
            id: parsed.userId,
            name: parsed.phoneNumber,
            phone: parsed.phoneNumber,
            shopId: user.id,
          })
          return
        }
      } catch (e) {
        console.error('Error parsing Firebase auth session:', e)
      }
    }
    
    // Fallback to old Twilio session
    const savedCustomer = localStorage.getItem('websiteCustomer')
    if (savedCustomer) {
      try {
        const parsed = JSON.parse(savedCustomer)
        if (parsed.shopId === user.id) {
          setCustomer(parsed)
        }
      } catch (e) {
        console.error('Error parsing customer session:', e)
      }
    }
  }, [user.id])

  useEffect(() => {
    document.body.className = theme
  }, [theme])

  const handleLoginSuccess = (userId: string, userName: string, authResult: FirebaseAuthResult) => {
    console.log('[WebsiteLayout] Firebase auth successful:', userId)
    console.log('[WebsiteLayout] Is new user:', authResult.isNewUser)
    console.log('[WebsiteLayout] Shop details filled:', authResult.shopDetailsFilled)
    
    setCustomer({
      id: userId,
      name: userName,
      phone: authResult.phoneNumber,
      shopId: user.id,
    })
  }

  const handleLogout = () => {
    localStorage.removeItem('websiteCustomer')
    localStorage.removeItem('firebaseAuth')
    setCustomer(null)
  }

  // Navigation items matching Flutter AppBar
  const navItems = [
    { label: 'Collections', key: 'collections', items: collections.map(c => ({ name: c.name, href: `/products?collection=${encodeURIComponent(c.name)}` })) },
    { label: 'Categories', key: 'categories', items: categories.map(c => ({ name: c.name, href: `/products?category=${encodeURIComponent(c.name)}` })) },
  ]

  return (
    <EditorProvider>
      <div className={cn(
        'min-h-screen',
        isDark ? 'bg-[#080808] text-white' : 'bg-offwhite text-black'
      )}>
        {/* Loading indicator for page transitions */}
        <LoadingIndicator />
        {/* Promotional Announcement Bar - matches Flutter _buildAnnouncementBar */}
        {announcements.length > 0 && (
          <AnnouncementBar 
            announcements={announcements}
            config={announcementBarConfig}
            isDark={isDark}
          />
        )}

        {/* Navigation - Two-row layout */}
        <header className={cn(
          'sticky top-0 z-50',
          isDark ? 'bg-[#121212]' : 'bg-white'
        )}>
          <nav className="px-2 sm:px-4 py-2 sm:py-3">
            {/* Top Row: Menu Icon (mobile only) + Logo + Shop Name + Search (right edge on mobile) */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-3">
              {/* Menu Icon - Left side (hidden on desktop) */}
              <button
                onClick={() => setShowDrawer(true)}
                className={cn(
                  'p-2 rounded-lg transition-colors flex-shrink-0 md:hidden',
                  isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
                )}
                aria-label="Open menu"
              >
                <Menu className={cn(
                  'w-6 h-6',
                  isDark ? 'text-white' : 'text-black'
                )} />
              </button>

              {/* Logo + Shop Name */}
              <Link href={`/`} className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                {user.logo_url && !logoError ? (
                  <div className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 lg:h-32 lg:w-32 flex items-center justify-center flex-shrink-0">
                    <Image
                      src={getImageUrl(user.logo_url)}
                      alt={user.shop_name || 'Store'}
                      width={1024}
                      height={1024}
                      quality={100}
                      className="object-contain w-full h-full"
                      priority
                      onError={() => setLogoError(true)}
                    />
                  </div>
                ) : (
                  <div className={cn(
                    "h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 lg:h-32 lg:w-32 flex items-center justify-center flex-shrink-0 rounded-full font-display text-2xl sm:text-3xl md:text-4xl font-bold",
                    isDark ? 'bg-gold-500 text-black' : 'bg-gold-500 text-white'
                  )}>
                    {user.shop_name?.charAt(0) || 'S'}
                  </div>
                )}
                <span className={cn(
                  'font-display text-base sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold tracking-wide truncate max-w-[120px] sm:max-w-[200px] md:max-w-[300px] lg:max-w-none',
                  isDark ? 'text-white' : 'text-black'
                )}>
                  {user.shop_name || 'YOUR BRAND'}
                </span>
              </Link>

              {/* Search Bar - Right edge on mobile, flexible width on desktop */}
              <div className="md:flex-1 md:min-w-0 flex-shrink-0">
                <SearchBar isDark={isDark} shopDomain={shopDomain} />
              </div>
            </div>

            {/* Bottom Row: Navigation Items + Actions */}
            <div className="flex items-center justify-between border-t pt-1.5 sm:pt-2" style={{
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            }}>
              {/* Left: Navigation Dropdowns - Scrollable on mobile */}
              <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto flex-shrink scrollbar-hide">
                {navItems.map((item) => (
                  <div
                    key={item.key}
                    className="relative"
                    onMouseEnter={() => item.items.length > 0 && setActiveDropdown(item.key)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <button
                      className={cn(
                        'flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap',
                        isDark ? 'text-white hover:text-gold-400' : 'text-black hover:text-gold-600'
                      )}
                    >
                      {item.label}
                      <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 opacity-60" />
                    </button>

                    {/* Dropdown Menu */}
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
              </div>

              {/* Right: Login/Logout + Wishlist + Cart */}
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                {/* Login/Logout Button */}
                {customer ? (
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className={cn(
                      'text-xs sm:text-sm font-medium hidden xl:inline',
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    )}>
                      <User className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                      {customer.name || 'Customer'}
                    </span>
                    <button 
                      onClick={handleLogout}
                      className={cn(
                        'flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-colors',
                        isDark ? 'text-white hover:text-gold-400' : 'text-black hover:text-gold-600'
                      )}
                    >
                      <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden lg:inline">Logout</span>
                    </button>
                  </div>
                ) : (
                  <a
                    href={typeof window !== 'undefined' 
                      ? `https://lustrai.in/auth?returnUrl=${encodeURIComponent(window.location.href)}`
                      : `https://lustrai.in/auth?returnUrl=${encodeURIComponent('https://lustrai.in')}`
                    }
                    className={cn(
                      'flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-colors',
                      isDark ? 'text-white hover:text-gold-400' : 'text-black hover:text-gold-600'
                    )}
                  >
                    <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden lg:inline">Login</span>
                  </a>
                )}
                
                {/* Wishlist */}
                <Link
                  href={`/wishlist`}
                  className={cn(
                    'p-1.5 sm:p-2 transition-colors',
                    isDark ? 'hover:text-gold-400' : 'hover:text-gold-600'
                  )}
                >
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
                
                {/* Cart */}
                <Link
                  href={`/cart`}
                  className={cn(
                    'p-1.5 sm:p-2 transition-colors',
                    isDark ? 'hover:text-gold-400' : 'hover:text-gold-600'
                  )}
                >
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </div>
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main>
          {/* Back Button - Only show on pages other than home */}
          {pathname !== '/' && (
            <div className="max-w-[1200px] mx-auto px-6 pt-4">
              <BackButton isDark={isDark} />
            </div>
          )}
          {children}
        </main>

        {/* Navigation Drawer */}
        <NavigationDrawer
          isOpen={showDrawer}
          onClose={() => setShowDrawer(false)}
          isDark={isDark}
          customer={customer}
          onLogout={handleLogout}
          onLoginClick={() => setShowLoginDialog(true)}
          categories={categories}
          collections={collections}
          shopDomain={shopDomain}
        />

        {/* Firebase Phone Login Dialog */}
        <FirebasePhoneLoginDialog
          isOpen={showLoginDialog}
          onClose={() => setShowLoginDialog(false)}
          onSuccess={handleLoginSuccess}
          shopName={user.shop_name}
          shopId={user.id}
          isDark={isDark}
        />
      </div>
    </EditorProvider>
  )
}