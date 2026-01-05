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
      'py-8',
      isDark ? 'bg-[#080808]' : 'bg-offwhite'
    )}>
      {/* Container with responsive padding matching Flutter */}
      <div 
        className="mx-auto"
        style={{ maxWidth: '1400px' }}
      >
        <div className="px-4 md:px-8 lg:px-[150px]">
          {/* Section Header - matches Flutter */}
          <div className="text-center mb-6">
            <span className={cn(
              'text-xs font-bold tracking-[0.15em] uppercase',
              isDark ? 'text-white/70' : 'text-gray-500'
            )}>
              TRENDING
            </span>
            <h2 className={cn(
              'text-sm mt-1.5',
              isDark ? 'text-white/60' : 'text-gray-500'
            )}>
              Discover what shoppers are loving right now
            </h2>
          </div>

          {/* Staggered Grid - matches Flutter's StaggeredGrid.count with crossAxisCount: 2 */}
          {/* Flutter uses mainAxisCellCount: 0.8, 1.2, 1.2, 0.8 for the 4 items */}
          <div className="grid grid-cols-2 gap-4">
            {/* Row layout: Left column (short, tall), Right column (tall, short) */}
            {/* Item 0 - short (0.8 ratio) */}
            <div className="flex flex-col gap-4">
              {displayCollections[0] && (
                <TrendingBox
                  collection={displayCollections[0]}
                  heightRatio={0.8}
                  isDark={isDark}
                />
              )}
              {displayCollections[1] && (
                <TrendingBox
                  collection={displayCollections[1]}
                  heightRatio={1.2}
                  isDark={isDark}
                />
              )}
            </div>
            {/* Right column */}
            <div className="flex flex-col gap-4">
              {displayCollections[2] && (
                <TrendingBox
                  collection={displayCollections[2]}
                  heightRatio={1.2}
                  isDark={isDark}
                />
              )}
              {displayCollections[3] && (
                <TrendingBox
                  collection={displayCollections[3]}
                  heightRatio={0.8}
                  isDark={isDark}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function TrendingBox({ collection, heightRatio, isDark }: { 
  collection: TrendingCollection
  heightRatio: number
  isDark: boolean 
}) {
  const [isHovered, setIsHovered] = useState(false)
  
  // Height based on ratio - base height ~200px, so 0.8 = 160px, 1.2 = 240px
  // On mobile, make them smaller
  const heightClass = heightRatio === 0.8 
    ? 'h-[140px] md:h-[180px] lg:h-[200px]' 
    : 'h-[200px] md:h-[260px] lg:h-[300px]'

  return (
    <Link
      href={`/collections/${collection.label.toLowerCase().replace(/\s+/g, '-')}`}
      className="block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className={cn(
          'relative rounded-xl overflow-hidden transition-all duration-300',
          heightClass,
          isHovered && '-translate-y-1.5'
        )}
        style={{
          boxShadow: isHovered 
            ? '0 12px 20px rgba(0,0,0,0.25)' 
            : '0 6px 10px rgba(0,0,0,0.1)',
        }}
      >
        <Image
          src={getImageUrl(collection.image)}
          alt={collection.label}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 40vw"
        />
        
        {/* Gradient overlay - matches Flutter */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Label - positioned at bottom left like Flutter */}
        <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4">
          <h3 className="text-white text-base md:text-lg lg:text-xl font-bold">
            {collection.label}
          </h3>
        </div>
      </div>
    </Link>
  )
}
