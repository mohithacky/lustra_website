'use client'

import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PromotionalAnnouncement } from '@/lib/supabase-new-architecture'

interface AnnouncementBarConfig {
  autoRotate: boolean
  rotateInterval: number
  showCloseButton: boolean
  defaultBackgroundColor: string
  defaultTextColor: string
}

interface AnnouncementBarProps {
  announcements: PromotionalAnnouncement[]
  config?: Partial<AnnouncementBarConfig>
  isDark?: boolean
}

const defaultConfig: AnnouncementBarConfig = {
  autoRotate: true,
  rotateInterval: 5000,
  showCloseButton: true,
  defaultBackgroundColor: '#D4AF37',
  defaultTextColor: '#000000',
}

export default function AnnouncementBar({ 
  announcements: initialAnnouncements, 
  config = {},
  isDark = false 
}: AnnouncementBarProps) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  const mergedConfig = { ...defaultConfig, ...config }

  const handleDismiss = useCallback(() => {
    if (announcements.length <= 1) {
      setIsVisible(false)
      return
    }

    const newAnnouncements = announcements.filter((_, i) => i !== currentIndex)
    setAnnouncements(newAnnouncements)
    
    if (currentIndex >= newAnnouncements.length && newAnnouncements.length > 0) {
      setCurrentIndex(0)
    }
  }, [announcements, currentIndex])

  useEffect(() => {
    if (!mergedConfig.autoRotate || announcements.length <= 1) return

    const hasAutoRotateEnabled = announcements.some(a => a.auto_rotate)
    if (!hasAutoRotateEnabled) return

    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % announcements.length)
    }, mergedConfig.rotateInterval)

    return () => clearInterval(timer)
  }, [announcements.length, mergedConfig.autoRotate, mergedConfig.rotateInterval])

  if (!isVisible || announcements.length === 0) {
    return null
  }

  const currentAnnouncement = announcements[currentIndex]
  const backgroundColor = currentAnnouncement.background_color || mergedConfig.defaultBackgroundColor
  const textColor = currentAnnouncement.text_color || mergedConfig.defaultTextColor
  const showCloseButton = currentAnnouncement.show_close_button ?? mergedConfig.showCloseButton

  return (
    <div
      className="w-full transition-all duration-500 ease-in-out"
      style={{ backgroundColor }}
    >
      <div className="relative px-4 py-3 flex items-center justify-center">
        {/* Announcement Message */}
        <div className="flex-1 flex items-center justify-center">
          <p
            className="text-sm font-medium text-center max-w-4xl"
            style={{ color: textColor }}
          >
            {currentAnnouncement.message}
          </p>
        </div>

        {/* Pagination Dots (if multiple announcements) */}
        {announcements.length > 1 && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-1 flex gap-1">
            {announcements.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  'w-1.5 h-1.5 rounded-full transition-all',
                  index === currentIndex 
                    ? 'opacity-100' 
                    : 'opacity-40 hover:opacity-70'
                )}
                style={{ backgroundColor: textColor }}
                aria-label={`Go to announcement ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Close Button */}
        {showCloseButton && (
          <button
            onClick={handleDismiss}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-opacity hover:opacity-70"
            style={{ color: textColor }}
            aria-label="Dismiss announcement"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
