'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Instagram, Facebook, Twitter, MapPin, Phone, Mail } from 'lucide-react'
import { cn, getImageUrl } from '@/lib/utils'

interface FooterProps {
  user: {
    shop_name: string | null
    logo_url: string | null
    shop_address: string | null
    phone_number: string | null
    email: string | null
    instagram_id: string | null
  }
  template: {
    footer?: Record<string, string[]> | null
  } | null
  isDark: boolean
}

export default function Footer({ user, template, isDark }: FooterProps) {
  const footerData = template?.footer as Record<string, string[]> | undefined

  return (
    <footer className={cn(
      'pt-16 pb-8',
      isDark ? 'bg-black text-white' : 'bg-zinc-900 text-white'
    )}>
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
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
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
                  className="p-2 bg-white/10 rounded-full hover:bg-gold-500 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              <a 
                href="#"
                className="p-2 bg-white/10 rounded-full hover:bg-gold-500 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="#"
                className="p-2 bg-white/10 rounded-full hover:bg-gold-500 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
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
                        href="#"
                        className="text-gray-400 hover:text-gold-400 text-sm transition-colors"
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
                <li className="flex items-start gap-3 text-sm text-gray-400">
                  <MapPin className="w-5 h-5 text-gold-500 flex-shrink-0 mt-0.5" />
                  <span>{user.shop_address}</span>
                </li>
              )}
              {user.phone_number && (
                <li>
                  <a 
                    href={`tel:${user.phone_number}`}
                    className="flex items-center gap-3 text-sm text-gray-400 hover:text-gold-400 transition-colors"
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
                    className="flex items-center gap-3 text-sm text-gray-400 hover:text-gold-400 transition-colors"
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
        <div className="border-t border-white/10 pt-8">
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
