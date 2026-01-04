'use client'

import Image from 'next/image'
import Link from 'next/link'
import { cn, getImageUrl } from '@/lib/utils'
import { TrendingCollection } from '@/types/database'

interface TrendingSectionProps {
  collections: TrendingCollection[]
  isDark: boolean
}

export default function TrendingSection({ collections, isDark }: TrendingSectionProps) {
  if (!collections.length) return null

  // Ensure we have exactly 4 items for the staggered grid
  const displayCollections = collections.slice(0, 4)

  return (
    <section className={cn(
      'py-16 md:py-24',
      isDark ? 'bg-[#080808]' : 'bg-offwhite'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className={cn(
            'text-xs font-bold tracking-[0.2em] uppercase',
            isDark ? 'text-gray-400' : 'text-gray-500'
          )}>
            Discover
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-semibold mt-2">
            Trending Collections
          </h2>
        </div>

        {/* Staggered Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {displayCollections.map((collection, index) => {
            // Staggered heights: tall, short, short, tall pattern
            const isTall = index === 0 || index === 3
            
            return (
              <Link
                key={index}
                href={`/collections/${collection.label.toLowerCase().replace(/\s+/g, '-')}`}
                className={cn(
                  'group relative overflow-hidden rounded-2xl',
                  isTall ? 'aspect-[3/4]' : 'aspect-square',
                  index === 1 && 'md:mt-12',
                  index === 2 && 'md:mt-12'
                )}
              >
                <Image
                  src={getImageUrl(collection.image)}
                  alt={collection.label}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div className={cn(
                  'absolute inset-0 transition-opacity duration-300',
                  isDark 
                    ? 'bg-gradient-to-t from-black/70 via-black/20 to-transparent'
                    : 'bg-gradient-to-t from-black/60 via-transparent to-transparent'
                )} />
                <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
                  <h3 className="font-display text-lg md:text-xl text-white font-medium">
                    {collection.label}
                  </h3>
                  <span className="text-white/70 text-sm mt-1 inline-block group-hover:text-gold-400 transition-colors">
                    Shop Now →
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
