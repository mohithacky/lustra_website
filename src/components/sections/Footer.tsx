'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Instagram, Facebook, MapPin, Phone, Mail, Edit } from 'lucide-react'
import { cn, getImageUrl } from '@/lib/utils'

interface FooterProps {
  user: {
    shop_name: string | null
    logo_url: string | null
    shop_address: string | null
    phone_number: string | null
    email: string | null
    instagram_id: string | null
    facebook_id?: string | null
  }
  template: {
    footer?: Record<string, string[]> | null
  } | null
  isDark: boolean
  canEdit?: boolean
  shopDomain?: string
}

// Helper function to get the correct href for footer links
function getFooterLinkHref(linkText: string): string {
  const lowerLink = linkText.toLowerCase()
  
  // About section links
  if (lowerLink === 'our story') return '/our-story'
  if (lowerLink === 'our shop') return '/our-shop'
  if (lowerLink === 'careers') return '/careers'
  if (lowerLink === 'press') return '/press'
  
  // Customer Care section links
  if (lowerLink === 'faqs') return '/faqs'
  if (lowerLink === 'contact us') return '/contact'
  if (lowerLink === 'shipping & returns') return '/shipping'
  if (lowerLink === 'warranty') return '/warranty'
  
  // Legal links
  if (lowerLink.includes('privacy')) return '/privacy'
  if (lowerLink.includes('terms') || lowerLink.includes('service')) return '/terms'
  if (lowerLink.includes('refund') || lowerLink.includes('return')) return '/refund'
  if (lowerLink.includes('about')) return '/about'
  
  // Shop section - links to products with category filter
  return `/products?category=${encodeURIComponent(linkText)}`
}

export default function Footer({ user, template, isDark, canEdit = false, shopDomain }: FooterProps) {
  const router = useRouter()
  const footerData = template?.footer as Record<string, string[]> | undefined

  return (
    <footer className={cn(
      'pt-16 pb-8 relative',
      isDark ? 'bg-zinc-100 text-gray-900' : 'bg-zinc-900 text-white'
    )}>
      {/* Edit button - matches Flutter Footer edit icon */}
      {canEdit && (
        <button
          onClick={() => shopDomain && router.push(`/editor/footer`)}
          className={cn("absolute top-4 right-4 p-2 rounded-full transition-colors z-10", isDark ? "bg-gray-200 hover:bg-gray-300" : "bg-white/10 hover:bg-white/20")}
          title="Edit Footer"
        >
          <Edit className={cn("w-5 h-5", isDark ? "text-gray-900" : "text-white")} />
        </button>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              {user.logo_url ? (
                <Image
                  src={getImageUrl(user.logo_url)}
                  alt={user.shop_name || 'Store'}
                  width={48}
                  height={48}
                  className="rounded-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gold-500 flex items-center justify-center font-display text-xl text-black">
                  {user.shop_name?.charAt(0) || 'S'}
                </div>
              )}
              <span className="font-display text-xl font-semibold">
                {user.shop_name || 'Jewelry Store'}
              </span>
            </div>
            <p className={cn("text-sm leading-relaxed mb-6", isDark ? "text-gray-600" : "text-gray-400")}>
              Discover exquisite jewelry pieces crafted with passion and precision. 
              Each piece tells a unique story.
            </p>
            
            {/* Social Links */}
            <div className="flex gap-4">
              {user.instagram_id && (
                <a 
                  href={`https://instagram.com/${user.instagram_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn("p-2 rounded-full hover:bg-gold-500 transition-colors", isDark ? "bg-gray-200" : "bg-white/10")}
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {user.facebook_id && (
                <a 
                  href={`https://facebook.com/${user.facebook_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn("p-2 rounded-full hover:bg-gold-500 transition-colors", isDark ? "bg-gray-200" : "bg-white/10")}
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Footer Links */}
          {footerData && Object.entries(footerData).map(([title, links]) => (
            links && links.length > 0 && (
              <div key={title}>
                <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">
                  {title}
                </h4>
                <ul className="space-y-3">
                  {links.map((link, index) => (
                    <li key={index}>
                      <Link 
                        href={getFooterLinkHref(link)}
                        className={cn("hover:text-gold-400 text-sm transition-colors", isDark ? "text-gray-600" : "text-gray-400")}
                      >
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )
          ))}

          {/* Contact Column */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">
              Contact Us
            </h4>
            <ul className="space-y-4">
              {user.shop_address && (
                <li className={cn("flex items-start gap-3 text-sm", isDark ? "text-gray-600" : "text-gray-400")}>
                  <MapPin className="w-5 h-5 text-gold-500 flex-shrink-0 mt-0.5" />
                  <span>{user.shop_address}</span>
                </li>
              )}
              {user.phone_number && (
                <li>
                  <a 
                    href={`tel:${user.phone_number}`}
                    className={cn("flex items-center gap-3 text-sm hover:text-gold-400 transition-colors", isDark ? "text-gray-600" : "text-gray-400")}
                  >
                    <Phone className="w-5 h-5 text-gold-500" />
                    <span>{user.phone_number}</span>
                  </a>
                </li>
              )}
              {user.email && (
                <li>
                  <a 
                    href={`mailto:${user.email}`}
                    className={cn("flex items-center gap-3 text-sm hover:text-gold-400 transition-colors", isDark ? "text-gray-600" : "text-gray-400")}
                  >
                    <Mail className="w-5 h-5 text-gold-500" />
                    <span>{user.email}</span>
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className={cn("border-t pt-8", isDark ? "border-gray-300" : "border-white/10")}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} {user.shop_name || 'Jewelry Store'}. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/privacy" className="text-gray-500 hover:text-gold-400 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-500 hover:text-gold-400 transition-colors">
                Terms of Service
              </Link>
            </div>
            <p className="text-gray-600 text-xs">
              Powered by{' '}
              <a 
                href="https://lustrai.in" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gold-500 hover:text-gold-400"
              >
                Lustra AI
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
 