'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn, getImageUrl } from '@/lib/utils'

interface TrendingCollection {
  label: string
  image: string
}

interface TrendingSectionProps {
  collections: TrendingCollection[]
  isDark: boolean
}

export default function TrendingSection({ collections, isDark }: TrendingSectionProps) {
  if (!collections.length) return null

  // Ensure we have exactly 4 items for the staggered grid like Flutter
  const displayCollections = collections.slice(0, 4)

  return (
    <section className={cn(
      'py-12 md:py-16',
      isDark ? 'bg-[#080808]' : 'bg-offwhite'
    )}>
      <div className="max-w-[1100px] mx-auto px-6">
        {/* Section Header - matches Flutter */}
        <div className="text-center mb-10">
          <span className={cn(
            'text-xs font-bold tracking-[0.15em] uppercase',
            isDark ? 'text-white/70' : 'text-gray-500'
          )}>
            TRENDING
          </span>
          <h2 className={cn(
            'font-display text-2xl font-semibold mt-2',
            isDark ? 'text-white' : 'text-black'
          )}>
            What&apos;s Hot Right Now
          </h2>
        </div>

        {/* Staggered Grid - matches Flutter's FourBoxStaggeredSection */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {displayCollections.map((collection, index) => (
            <TrendingBox
              key={index}
              collection={collection}
              index={index}
              isDark={isDark}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function TrendingBox({ collection, index, isDark }: { 
  collection: TrendingCollection
  index: number
  isDark: boolean 
}) {
  const [isHovered, setIsHovered] = useState(false)
  
  // Staggered heights matching Flutter: 0.8, 1.2, 1.2, 0.8 ratio
  const isShort = index === 0 || index === 3

  return (
    <Link
      href={`/collections/${collection.label.toLowerCase().replace(/\s+/g, '-')}`}
      className={cn(
        'group relative overflow-hidden rounded-xl',
        isShort ? 'aspect-[4/3]' : 'aspect-[3/4]',
        // Offset middle items like Flutter
        (index === 1 || index === 2) && 'md:-mt-8'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className={cn(
          'absolute inset-0 transition-all duration-300',
          isHovered ? 'scale-105' : 'scale-100'
        )}
        style={{
          transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
        }}
      >
        <Image
          src={getImageUrl(collection.image)}
          alt={collection.label}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
      </div>
      
      {/* Gradient overlay - matches Flutter */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      
      {/* Shadow on hover - matches Flutter */}
      <div 
        className={cn(
          'absolute inset-0 rounded-xl transition-shadow duration-300',
          isHovered ? 'shadow-2xl' : 'shadow-lg'
        )}
      />
      
      {/* Label - positioned at bottom left like Flutter */}
      <div className="absolute bottom-4 left-4">
        <h3 className="text-white text-lg md:text-xl font-bold">
          {collection.label}
        </h3>
      </div>
    </Link>
  )
}
