'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn, getImageUrl } from '@/lib/utils'
import { HeroCollection } from '@/types/database'

interface HeroCarouselProps {
  collections: HeroCollection[]
  isDark: boolean
}

export default function HeroCarousel({ collections, isDark }: HeroCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true },
    [Autoplay({ delay: 5000, stopOnInteraction: false })]
  )
  const [selectedIndex, setSelectedIndex] = useState(0)

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

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
    <section className="relative w-full h-[60vh] md:h-[80vh] lg:h-screen overflow-hidden">
      <div className="embla h-full" ref={emblaRef}>
        <div className="embla__container h-full">
          {collections.map((collection, index) => (
            <div key={collection.id} className="embla__slide relative h-full">
              <Image
                src={getImageUrl(collection.image_url)}
                alt={collection.name}
                fill
                className="object-cover"
                priority={index === 0}
                sizes="100vw"
              />
              {/* Gradient Overlay */}
              <div className={cn(
                'absolute inset-0',
                isDark 
                  ? 'bg-gradient-to-t from-black/80 via-black/30 to-transparent'
                  : 'bg-gradient-to-t from-black/60 via-black/20 to-transparent'
              )} />
              
              {/* Content */}
              <div className="absolute inset-0 flex items-end justify-center pb-20 md:pb-32">
                <div className="text-center text-white px-4">
                  <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-semibold mb-4 animate-fade-in">
                    {collection.name}
                  </h2>
                  <button className="btn-gold rounded-none uppercase text-sm tracking-widest">
                    Explore Collection
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      {collections.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {collections.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {collections.map((_, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                index === selectedIndex
                  ? 'w-8 bg-gold-500'
                  : 'bg-white/50 hover:bg-white/80'
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
