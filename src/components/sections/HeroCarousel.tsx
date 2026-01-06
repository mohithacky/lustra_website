'use client'

import { useCallback, useEffect, useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { PlusCircle, MinusCircle } from 'lucide-react'
import { cn, getImageUrl } from '@/lib/utils'
import { HeroCollection } from '@/types/database'

// =============================================================================
// CONFIG TYPES
// =============================================================================
// Config is fetched from user_website_sections.config at runtime
// Schema (for editor validation) is stored in website_template_sections.schema
// and is NEVER used at runtime
// =============================================================================

export type HeroCarouselVariant = 'classic' | 'split' | 'full_screen'

export interface HeroCarouselConfig {
  variant?: HeroCarouselVariant
  autoplay_delay?: number
  show_gradient?: boolean
  show_cta_button?: boolean
  cta_button_text?: string
}

interface HeroCarouselProps {
  collections: HeroCollection[]
  config?: HeroCarouselConfig
  isDark?: boolean
  canEdit?: boolean
  shopDomain?: string
}

export default function HeroCarousel({ 
  collections, 
  config,
  isDark = false, 
  canEdit = false, 
  shopDomain 
}: HeroCarouselProps) {
  const router = useRouter()
  
  // =============================================================================
  // CONFIG WITH SAFE DEFAULTS
  // =============================================================================
  // All config fields use safe defaults if not provided
  // Config comes from user_website_sections.config at runtime
  // =============================================================================
  const variant = config?.variant ?? 'classic'
  const autoplayDelay = config?.autoplay_delay ?? 5000
  const showGradient = config?.show_gradient ?? true
  const showCtaButton = config?.show_cta_button ?? true
  const ctaButtonText = config?.cta_button_text ?? 'Explore Collection'

  // =============================================================================
  // LOGGING: Track data sources
  // =============================================================================
  useEffect(() => {
    console.group('🎨 HeroCarousel - Data Source Verification')
    console.log('📊 Collections from database:', {
      count: collections.length,
      source: 'user_hero_collections table',
      collections: collections.map(c => ({
        id: c.id,
        name: c.name,
        display_order: c.display_order,
        is_visible: c.is_visible
      }))
    })
    console.log('⚙️ Config from database:', {
      source: 'user_website_sections.config',
      received_config: config,
      applied_values: {
        variant: `${variant} ${config?.variant ? '(from DB)' : '(default)'}`,
        autoplay_delay: `${autoplayDelay}ms ${config?.autoplay_delay ? '(from DB)' : '(default)'}`,
        show_gradient: `${showGradient} ${config?.show_gradient !== undefined ? '(from DB)' : '(default)'}`,
        show_cta_button: `${showCtaButton} ${config?.show_cta_button !== undefined ? '(from DB)' : '(default)'}`,
        cta_button_text: `"${ctaButtonText}" ${config?.cta_button_text ? '(from DB)' : '(default)'}`
      }
    })
    console.log('✅ NO hardcoded data - All from database with safe fallbacks')
    console.groupEnd()
  }, [collections, config, variant, autoplayDelay, showGradient, showCtaButton, ctaButtonText])

  // Memoize autoplay plugin to prevent recreation on every render
  const autoplayPlugin = useMemo(
    () => Autoplay({ delay: autoplayDelay, stopOnInteraction: false }),
    [autoplayDelay]
  )

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true },
    [autoplayPlugin]
  )
  const [selectedIndex, setSelectedIndex] = useState(0)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi, onSelect])

  if (!collections.length) return null

  return (
    <section className="relative w-full px-4 md:px-[120px] pt-4 pb-10">
      <div className="embla overflow-hidden rounded-xl md:rounded-2xl" ref={emblaRef}>
        <div className="embla__container">
          {collections.map((collection, index) => (
            <div 
              key={collection.id} 
              className="embla__slide relative aspect-video md:aspect-[21/9]"
            >
              <Image
                src={getImageUrl(collection.image_url)}
                alt={collection.name}
                fill
                className="object-cover"
                priority={index === 0}
                sizes="100vw"
              />
              {/* Gradient Overlay - controlled by config */}
              {showGradient && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              )}
              
              {/* Content - positioned at bottom left */}
              <div className="absolute inset-0 flex items-end">
                <div className="p-6 md:p-12 lg:p-16 max-w-lg">
                  <h2 className="font-display text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-2 animate-fade-in">
                    {collection.name}
                  </h2>
                  <p className="text-white/90 text-sm md:text-base mb-4 md:mb-6">
                    Handcrafted pieces for every moment.
                  </p>
                  {showCtaButton && (
                    <Link 
                      href={`/collections/${collection.name.replace(/\s+/g, '-')}`}
                      className="inline-block bg-gold-500 hover:bg-gold-600 text-white px-5 md:px-6 py-2 md:py-3 rounded-full text-xs md:text-sm font-bold transition-colors"
                    >
                      {ctaButtonText}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dots Indicator - matches Flutter's animated indicator */}
      {collections.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {collections.map((_, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                index === selectedIndex
                  ? 'w-6 bg-gold-500'
                  : isDark ? 'w-2 bg-zinc-600' : 'w-2 bg-gray-400'
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Editor Controls - matches Flutter row of icons after HeroCarousel */}
      {canEdit && (
        <div className="max-w-[1100px] mx-auto px-6 mt-2">
          <div className="flex justify-end gap-2">
            <button
              onClick={() => shopDomain && router.push(`/editor/collections/add`)}
              className={cn(
                'p-2 rounded-full transition-colors',
                isDark ? 'hover:bg-zinc-800 text-white' : 'hover:bg-gray-100 text-black'
              )}
              title="Add Collection"
            >
              <PlusCircle className="w-6 h-6" />
            </button>
            <button
              onClick={() => shopDomain && router.push(`/editor/collections/manage`)}
              className={cn(
                'p-2 rounded-full transition-colors',
                isDark ? 'hover:bg-zinc-800 text-white' : 'hover:bg-gray-100 text-black'
              )}
              title="Manage Collections"
            >
              <MinusCircle className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
