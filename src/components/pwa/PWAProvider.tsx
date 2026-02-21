'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

interface PWAProviderProps {
  shopDomain: string
  shopName: string
  isDark?: boolean
}

/**
 * PWAProvider handles:
 * 1. Dynamically injecting the per-subdomain manifest.json link into <head>
 * 2. Registering the service worker
 * 3. Showing an "Add to Home Screen" install prompt
 * 
 * Each subdomain (e.g., ashmitjewellers.lustrai.in) gets its own manifest,
 * so "Add to Home Screen" saves ONLY that specific shop URL.
 */
export default function PWAProvider({ shopDomain, shopName, isDark }: PWAProviderProps) {
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // 1. Inject dynamic manifest link into <head>
    const existingManifest = document.querySelector('link[rel="manifest"]')
    if (existingManifest) {
      existingManifest.remove()
    }

    const manifestLink = document.createElement('link')
    manifestLink.rel = 'manifest'
    manifestLink.href = `/api/manifest/${shopDomain}`
    document.head.appendChild(manifestLink)

    // 2. Add theme-color meta tag
    let themeColorMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta')
      themeColorMeta.name = 'theme-color'
      document.head.appendChild(themeColorMeta)
    }
    themeColorMeta.content = isDark ? '#080808' : '#C5A572'

    // 3. Add apple-touch-icon meta tags for iOS
    let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-capable"]') as HTMLMetaElement
    if (!appleMeta) {
      appleMeta = document.createElement('meta')
      appleMeta.name = 'apple-mobile-web-app-capable'
      appleMeta.content = 'yes'
      document.head.appendChild(appleMeta)
    }

    let appleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]') as HTMLMetaElement
    if (!appleStatusBar) {
      appleStatusBar = document.createElement('meta')
      appleStatusBar.name = 'apple-mobile-web-app-status-bar-style'
      appleStatusBar.content = isDark ? 'black-translucent' : 'default'
      document.head.appendChild(appleStatusBar)
    }

    let appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement
    if (!appleTitle) {
      appleTitle = document.createElement('meta')
      appleTitle.name = 'apple-mobile-web-app-title'
      appleTitle.content = shopName
      document.head.appendChild(appleTitle)
    }

    // 4. Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('[PWA] Service worker registered:', registration.scope)
        })
        .catch((error) => {
          console.error('[PWA] Service worker registration failed:', error)
        })
    }

    // 5. Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    // 6. Listen for the beforeinstallprompt event (Chrome/Edge/Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
      // Only show banner if not dismissed before for this shop
      const dismissed = localStorage.getItem(`pwa-dismissed-${shopDomain}`)
      if (!dismissed) {
        setShowInstallBanner(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // 7. Listen for successful install
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallBanner(false)
      setInstallPrompt(null)
      console.log('[PWA] App installed successfully for:', shopDomain)
    }

    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [shopDomain, shopName, isDark])

  const handleInstallClick = async () => {
    if (!installPrompt) return

    const result = await installPrompt.prompt()
    console.log('[PWA] Install prompt result:', result?.outcome)

    if (result?.outcome === 'accepted') {
      setShowInstallBanner(false)
    }
    setInstallPrompt(null)
  }

  const handleDismiss = () => {
    setShowInstallBanner(false)
    localStorage.setItem(`pwa-dismissed-${shopDomain}`, 'true')
  }

  // Don't show if already installed or no prompt available
  if (isInstalled || !showInstallBanner) return null

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-[9999] p-3 sm:p-4 transition-transform duration-300 ${
      showInstallBanner ? 'translate-y-0' : 'translate-y-full'
    }`}>
      <div className={`max-w-lg mx-auto rounded-xl shadow-2xl p-4 flex items-center gap-3 ${
        isDark 
          ? 'bg-zinc-900 border border-zinc-700 text-white' 
          : 'bg-white border border-gray-200 text-black'
      }`}>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{shopName}</p>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Add to home screen for quick access
          </p>
        </div>
        <button
          onClick={handleInstallClick}
          className="flex-shrink-0 px-4 py-2 bg-[#C5A572] text-white text-sm font-semibold rounded-lg hover:bg-[#A68B5B] transition-colors"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          className={`flex-shrink-0 p-1 rounded-full ${
            isDark ? 'hover:bg-zinc-800 text-gray-400' : 'hover:bg-gray-100 text-gray-400'
          }`}
          aria-label="Dismiss"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  )
}
