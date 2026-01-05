'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn, getImageUrl } from '@/lib/utils'

interface BestCollection {
  name: string
  image: string
  description?: string
}

interface BestCollectionsSectionProps {
  collections: BestCollection[]
  isDark: boolean
  shopDomain?: string
}

export default function BestCollectionsSection({ collections, isDark, shopDomain = '' }: BestCollectionsSectionProps) {
  if (!collections.length) return null

  return (
    <section className={cn(
      'py-12 md:py-16',
      isDark ? 'bg-[#080808]' : 'bg-offwhite'
    )}>
      <div className="max-w-[1100px] mx-auto px-6">
        {/* Section Header - matches Flutter */}
        <div className="text-center mb-10">
          <span className={cn(
            'text-xs font-bold tracking-[0.2em] uppercase',
            isDark ? 'text-white/70' : 'text-gray-500'
          )}>
            BEST COLLECTIONS
          </span>
          <h2 className={cn(
            'font-display text-2xl font-semibold mt-2',
            isDark ? 'text-white' : 'text-black'
          )}>
            Featured Collections
          </h2>
        </div>

        {/* Collections - matches Flutter FeaturedCollectionsShowcase layout */}
        <div className="space-y-8">
          {collections.map((collection, index) => (
            <FeaturedCollectionRow
              key={index}
              collection={collection}
              reverse={index % 2 === 1}
              isDark={isDark}
              shopDomain={shopDomain}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function FeaturedCollectionRow({ collection, reverse, isDark, shopDomain }: {
  collection: BestCollection
  reverse: boolean
  isDark: boolean
  shopDomain: string
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className={cn(
      'flex flex-col md:flex-row gap-6',
      reverse && 'md:flex-row-reverse'
    )}>
      {/* Image Card - matches Flutter _ImageCard */}
      <Link
        href={`/collections/${collection.name.toLowerCase().replace(/\s+/g, '-')}`}
        className="flex-1"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div 
          className={cn(
            'relative aspect-video rounded-xl overflow-hidden transition-transform duration-300',
            isHovered && 'scale-[1.03]'
          )}
        >
          <Image
            src={getImageUrl(collection.image)}
            alt={collection.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      </Link>

      {/* Description Card - matches Flutter _DescriptionCard */}
      <div className={cn(
        'flex-1 p-6 md:p-8 rounded-xl shadow-lg',
        isDark ? 'bg-zinc-800' : 'bg-white'
      )}>
        <h3 className={cn(
          'font-display text-xl md:text-2xl font-bold mb-4',
          isDark ? 'text-white' : 'text-black'
        )}>
          {collection.name}
        </h3>
        {collection.description && (
          <p className={cn(
            'text-sm md:text-base leading-relaxed mb-6',
            isDark ? 'text-gray-300' : 'text-gray-700'
          )}>
            {collection.description}
          </p>
        )}
        <Link
          href={`/collections/${collection.name.toLowerCase().replace(/\s+/g, '-')}`}
          className="inline-flex items-center text-gold-500 font-bold text-sm hover:text-gold-600 transition-colors"
        >
          Explore Collection
          <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
