'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, Heart, ShoppingCart, ChevronDown, LogIn, LogOut, User } from 'lucide-react'
import { cn, getImageUrl } from '@/lib/utils'
import { Category, Collection } from '@/types/database'
import PhoneLoginDialog from '@/components/auth/PhoneLoginDialog'
import EditorProvider from '@/components/editor/EditorProvider'
import AnnouncementBar from '@/components/sections/AnnouncementBar'
import { PromotionalAnnouncement } from '@/lib/supabase-new-architecture'
import BackButton from '@/components/ui/BackButton'
import LoadingIndicator from '@/components/ui/LoadingIndicator'

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
}: WebsiteLayoutProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [customer, setCustomer] = useState<CustomerSession | null>(null)
  const [generatedLogo, setGeneratedLogo] = useState<string | null>(null)
  const [isLoadingLogo, setIsLoadingLogo] = useState(false)
  const pathname = usePathname()

  const isDark = theme === 'dark'
  const shopDomain = user.shop_domain || ''

  // Generate AI logo from user's uploaded logo
  useEffect(() => {
    const generateLogo = async () => {
      if (!user.logo_url) return
      
      // Check if we already have a cached logo for this user
      const cacheKey = `generated_logo_${user.id}`
      const cachedLogo = localStorage.getItem(cacheKey)
      if (cachedLogo) {
        setGeneratedLogo(cachedLogo)
        return
      }

      setIsLoadingLogo(true)
      try {
        // Fetch the user's logo image and convert to base64
        const logoUrl = getImageUrl(user.logo_url)
        const response = await fetch(logoUrl)
        const blob = await response.blob()
        
        // Convert blob to base64
        const reader = new FileReader()
        reader.onloadend = async () => {
          const base64data = reader.result as string
          // Remove data URL prefix to get raw base64
          const base64Only = base64data.split(',')[1]
          
          try {
            // Call the generate-logo API
            const apiResponse = await fetch('https://us-central1-lustra-4552b.cloudfunctions.net/api/generate-logo', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ logoImageBase64: base64Only }),
            })
            
            if (apiResponse.ok) {
              const data = await apiResponse.json()
              if (data.generatedLogo) {
                setGeneratedLogo(data.generatedLogo)
                // Cache the generated logo
                localStorage.setItem(cacheKey, data.generatedLogo)
              }
            } else {
              console.error('Failed to generate logo:', await apiResponse.text())
            }
          } catch (apiError) {
            console.error('Error calling generate-logo API:', apiError)
          } finally {
            setIsLoadingLogo(false)
          }
        }
        reader.readAsDataURL(blob)
      } catch (error) {
        console.error('Error fetching logo for generation:', error)
        setIsLoadingLogo(false)
      }
    }

    generateLogo()
  }, [user.id, user.logo_url])

  // Load customer from localStorage on mount
  useEffect(() => {
    const savedCustomer = localStorage.getItem('websiteCustomer')
    if (savedCustomer) {
      try {
        const parsed = JSON.parse(savedCustomer)
        // Only use if it's for the same shop
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

  const handleLoginSuccess = (customerId: string, customerName: string) => {
    setCustomer({
      id: customerId,
      name: customerName,
      phone: '',
      shopId: user.id,
    })
  }

  const handleLogout = () => {
    localStorage.removeItem('websiteCustomer')
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

        {/* Navigation - matches Flutter SliverAppBar */}
        <header className={cn(
          'sticky top-0 z-50',
          isDark ? 'bg-[#121212]' : 'bg-white'
        )}>
          <nav className="px-4">
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* Left: Spacer for mobile */}
            <div className="w-10 h-10 md:hidden" />

            {/* Center: AI-Generated Logo + Shop Name */}
            <Link href={`/`} className="flex items-center gap-2 mx-auto md:mx-0 max-w-[60%] md:max-w-none">
              {generatedLogo ? (
                <div className="relative flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`data:image/jpeg;base64,${generatedLogo}`}
                    alt={user.shop_name || 'Store'}
                    width={40}
                    height={40}
                    className={cn(
                      "rounded-full object-cover ring-2",
                      isDark ? "ring-zinc-700" : "ring-gray-200"
                    )}
                  />
                </div>
              ) : isLoadingLogo ? (
                <div className={cn(
                  "w-10 h-10 rounded-full animate-pulse",
                  isDark ? "bg-zinc-700" : "bg-gray-200"
                )} />
              ) : null}
              <span className={cn(
                'font-display text-base sm:text-lg md:text-xl font-bold tracking-wide truncate',
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
                      'flex items-center gap-1 px-2 lg:px-3 py-2 text-xs lg:text-sm font-semibold transition-colors whitespace-nowrap',
                      isDark ? 'text-white hover:text-gold-400' : 'text-black hover:text-gold-600'
                    )}
                  >
                    {item.label}
                    <ChevronDown className="w-3 lg:w-4 h-3 lg:h-4 opacity-60" />
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

              {/* Login/Logout Button - matches Flutter canShowCustomerLogin */}
              {customer ? (
                <div className="flex items-center gap-1 lg:gap-2">
                  <span className={cn(
                    'text-xs lg:text-sm font-medium hidden lg:inline',
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  )}>
                    <User className="w-4 h-4 inline mr-1" />
                    {customer.name || 'Customer'}
                  </span>
                  <button 
                    onClick={handleLogout}
                    className={cn(
                      'flex items-center gap-1 lg:gap-1.5 px-2 lg:px-3 py-2 text-xs lg:text-sm font-semibold transition-colors',
                      isDark ? 'text-white hover:text-gold-400' : 'text-black hover:text-gold-600'
                    )}
                  >
                    <LogOut className="w-4 lg:w-5 h-4 lg:h-5" />
                    <span className="hidden lg:inline">Logout</span>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setShowLoginDialog(true)}
                  className={cn(
                    'flex items-center gap-1 lg:gap-1.5 px-2 lg:px-3 py-2 text-xs lg:text-sm font-semibold transition-colors',
                    isDark ? 'text-white hover:text-gold-400' : 'text-black hover:text-gold-600'
                  )}
                >
                  <LogIn className="w-4 lg:w-5 h-4 lg:h-5" />
                  <span className="hidden lg:inline">Login</span>
                </button>
              )}
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
              <Link
                href={`/wishlist`}
                className={cn(
                  'p-2 transition-colors',
                  isDark ? 'hover:text-gold-400' : 'hover:text-gold-600'
                )}
              >
                <Heart className="w-5 h-5" />
              </Link>
              
              {/* Cart - matches Flutter shopping_cart_outlined icon */}
              <Link
                href={`/cart`}
                className={cn(
                  'p-2 transition-colors',
                  isDark ? 'hover:text-gold-400' : 'hover:text-gold-600'
                )}
              >
                <ShoppingCart className="w-5 h-5" />
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

      {/* Phone Login Dialog */}
      <PhoneLoginDialog
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
 