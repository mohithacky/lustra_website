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
  shopDomain?: string
}

export default function TrendingSection({ collections, isDark, shopDomain = '' }: TrendingSectionProps) {
  if (!collections.length) return null

  // Ensure we have exactly 4 items for the staggered grid like Flutter
  const displayCollections = collections.slice(0, 4)

  // Flutter responsive padding: <600: 16, <1200: 32, >=1200: 150
  return (
    <section className={cn(
      'py-5',
      isDark ? 'bg-[#080808]' : 'bg-offwhite'
    )}>
      <div className="mx-auto" style={{ maxWidth: '1400px' }}>
        <div className="px-4 md:px-8 lg:px-[150px]">
          {/* Section Header - matches Flutter sectionHeadingStyle */}
          <div className="text-center mb-5">
            <span className={cn(
              'text-xs font-bold tracking-[0.15em] uppercase',
              isDark ? 'text-white/70' : 'text-gray-500'
            )}>
              TRENDING
            </span>
            <p className={cn(
              'text-sm mt-1.5',
              isDark ? 'text-white/60' : 'text-gray-500'
            )}>
              Discover what shoppers are loving right now
            </p>
          </div>

          {/* StaggeredGrid.count with crossAxisCount: 2
              Flutter layout: Items are placed sequentially in rows
              Row 0: [Item 0 (0.8)] [Item 1 (1.2)]  
              Row 1: [Item 2 (1.2)] [Item 3 (0.8)]
              
              This creates a staggered effect where:
              - Left column: short on top, tall on bottom
              - Right column: tall on top, short on bottom
          */}
          <div className="grid grid-cols-2 gap-4">
            {displayCollections.map((collection, index) => (
              <TrendingBox
                key={index}
                collection={collection}
                // Flutter mainAxisCellCount values: 0.8, 1.2, 1.2, 0.8
                heightRatio={index === 0 || index === 3 ? 0.8 : 1.2}
                isDark={isDark}
                shopDomain={shopDomain}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function TrendingBox({ collection, heightRatio, isDark, shopDomain }: { 
  collection: TrendingCollection
  heightRatio: number
  isDark: boolean
  shopDomain: string
}) {
  const [isHovered, setIsHovered] = useState(false)
  
  // Flutter StaggeredGridTile uses mainAxisCellCount for height ratio
  // Base cell height varies by screen, using aspect ratio approach
  // 0.8 ratio = shorter box, 1.2 ratio = taller box
  // Using padding-bottom trick for aspect ratio
  const aspectRatio = heightRatio === 0.8 ? '75%' : '125%' // roughly 4:3 vs 4:5

  return (
    <Link
      href={`/collections/${collection.label.toLowerCase().replace(/\s+/g, '-')}`}
      className="block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* AnimatedContainer with translate and shadow on hover */}
      <div 
        className={cn(
          'relative rounded-xl overflow-hidden transition-all duration-200',
          isHovered && '-translate-y-1.5'
        )}
        style={{
          paddingBottom: aspectRatio,
          boxShadow: isHovered 
            ? '0 12px 20px rgba(0,0,0,0.25)' 
            : '0 6px 10px rgba(0,0,0,0.1)',
        }}
      >
        <Image
          src={getImageUrl(collection.image)}
          alt={collection.label}
          fill
          className="object-cover absolute inset-0"
          sizes="(max-width: 768px) 50vw, 40vw"
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Label - positioned at bottom left like Flutter */}
        <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4">
          <h3 className="text-white text-sm md:text-base lg:text-lg font-bold drop-shadow-lg">
            {collection.label}
          </h3>
        </div>
      </div>
    </Link>
  )
}
