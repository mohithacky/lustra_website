'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { PlusCircle, MinusCircle } from 'lucide-react'
import { cn, getImageUrl } from '@/lib/utils'
import { HeroCollection } from '@/types/database'

interface HeroCarouselProps {
  collections: HeroCollection[]
  isDark: boolean
  canEdit?: boolean
  shopDomain?: string
  autoplay?: boolean
  interval?: number
  showIndicators?: boolean
  showArrows?: boolean
  height?: string
  overlayOpacity?: number
  textColor?: string
  ctaText?: string
  ctaLink?: string
}

export default function HeroCarousel({ 
  collections, 
  isDark, 
  canEdit = false, 
  shopDomain,
  autoplay = true,
  interval = 5000,
  showIndicators = true,
  showArrows = true,
  height = "large",
  overlayOpacity = 0.3,
  textColor = "#ffffff",
  ctaText = "Shop Now",
  ctaLink = "/collections"
}: HeroCarouselProps) {
  const router = useRouter()
  const autoplayPlugin = autoplay ? [Autoplay({ delay: interval, stopOnInteraction: false })] : []
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true },
    autoplayPlugin
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
    <section className="relative w-full md:px-[120px] md:pt-4 pb-10">
      <div className="embla overflow-hidden md:rounded-2xl" ref={emblaRef}>
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
                unoptimized
              />
              {/* Gradient Overlay - matches Flutter */}
              <div 
                className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" 
                style={{ opacity: overlayOpacity }}
              />
              
              {/* Content - positioned at bottom left like Flutter */}
              <div className="absolute inset-0 flex items-end">
                <div className="p-6 md:p-12 lg:p-16 max-w-lg">
                  <h2 
                    className="font-display text-2xl md:text-4xl lg:text-5xl font-bold mb-2 animate-fade-in"
                    style={{ color: textColor }}
                  >
                    {collection.name}
                  </h2>
                  <p 
                    className="text-sm md:text-base mb-4 md:mb-6"
                    style={{ color: textColor, opacity: 0.9 }}
                  >
                    Handcrafted pieces for every moment.
                  </p>
                  <Link 
                    href={`/products?collection=${encodeURIComponent(collection.name)}&source=hero-collection`}
                    className="inline-block bg-gold-500 hover:bg-gold-600 text-white px-5 md:px-6 py-2 md:py-3 rounded-full text-xs md:text-sm font-bold transition-colors"
                  >
                    {ctaText}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dots Indicator - matches Flutter's animated indicator */}
      {showIndicators && collections.length > 1 && (
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
 