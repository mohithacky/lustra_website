'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { cn, getImageUrl } from '@/lib/utils'

interface TrendingCollection {
  label: string
  image: string
}

interface TrendingSectionProps {
  collections: TrendingCollection[]
  isDark: boolean
  canEdit?: boolean
  shopDomain?: string
  title?: string
  subtitle?: string
  columns?: number
  showLabels?: boolean
  maxItems?: number
  layout?: string
}

export default function TrendingSection({ 
  collections, 
  isDark, 
  canEdit = false, 
  shopDomain,
  title = "Trending Collections",
  subtitle = "What everyone is loving",
  columns = 4,
  showLabels = true,
  maxItems = 4,
  layout = "grid"
}: TrendingSectionProps) {
  const router = useRouter()
  
  if (!collections.length) return null

  // Ensure we have exactly maxItems for the staggered grid like Flutter
  const displayCollections = collections.slice(0, maxItems)
  
  const handleEditSection = () => {
    if (shopDomain) {
      router.push(`/editor/trending`)
    }
  }

  // Flutter responsive padding: <600: 16, <1200: 32, >=1200: 150
  return (
    <section className={cn(
      'py-5 relative',
      isDark ? 'bg-[#080808]' : 'bg-offwhite'
    )}>
      {/* Single Edit Button for Entire Section */}
      {canEdit && (
        <button
          onClick={handleEditSection}
          className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-2 bg-white/90 hover:bg-white rounded-full shadow-lg border border-gray-200 transition-all hover:scale-105"
          title="Edit Trending Collections"
        >
          <Pencil className="w-4 h-4 text-gray-700" />
          <span className="text-sm font-medium text-gray-700">Edit Section</span>
        </button>
      )}
      
      <div className="mx-auto" style={{ maxWidth: '1400px' }}>
        <div className="px-4 md:px-8 lg:px-[150px]">
          {/* Section Header - matches Flutter sectionHeadingStyle */}
          <div className="text-center mb-5">
            <h2 className={cn(
              'text-xl md:text-2xl font-bold mb-2',
              isDark ? 'text-white' : 'text-black'
            )}>
              {title}
            </h2>
            {subtitle && (
              <p className={cn(
                'text-sm mt-1.5',
                isDark ? 'text-white/60' : 'text-gray-500'
              )}>
                {subtitle}
              </p>
            )}
          </div>

          {/* StaggeredGrid.count with crossAxisCount: 2
              Flutter layout: 2 COLUMNS, each holding 2 boxes stacked vertically
              - Left column: Item 0 (0.8 short) on top, Item 2 (1.2 tall) below
              - Right column: Item 1 (1.2 tall) on top, Item 3 (0.8 short) below
              
              This creates the staggered masonry effect
          */}
          <div className="flex gap-4">
            {/* Left Column */}
            <div className="flex-1 flex flex-col gap-4">
              {displayCollections[0] && (
                <TrendingBox
                  collection={displayCollections[0]}
                  heightRatio={0.8}
                  isDark={isDark}
                  showLabels={showLabels}
                />
              )}
              {displayCollections[2] && (
                <TrendingBox
                  collection={displayCollections[2]}
                  heightRatio={1.2}
                  isDark={isDark}
                  showLabels={showLabels}
                />
              )}
            </div>
            {/* Right Column */}
            <div className="flex-1 flex flex-col gap-4">
              {displayCollections[1] && (
                <TrendingBox
                  collection={displayCollections[1]}
                  heightRatio={1.2}
                  isDark={isDark}
                  showLabels={showLabels}
                />
              )}
              {displayCollections[3] && (
                <TrendingBox
                  collection={displayCollections[3]}
                  heightRatio={0.8}
                  isDark={isDark}
                  showLabels={showLabels}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function TrendingBox({ collection, heightRatio, isDark, showLabels = true }: { 
  collection: TrendingCollection
  heightRatio: number
  isDark: boolean
  showLabels?: boolean
}) {
  const [isHovered, setIsHovered] = useState(false)
  
  // Flutter StaggeredGridTile uses mainAxisCellCount for height ratio
  // Base cell height varies by screen, using aspect ratio approach
  // 0.8 ratio = shorter box, 1.2 ratio = taller box
  // Using padding-bottom trick for aspect ratio
  const aspectRatio = heightRatio === 0.8 ? '75%' : '125%' // roughly 4:3 vs 4:5

  return (
    <Link
      href={`/products?collection=${encodeURIComponent(collection.label)}`}
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
        {showLabels && (
          <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4">
            <h3 className="text-white text-sm md:text-base lg:text-lg font-bold drop-shadow-lg">
              {collection.label}
            </h3>
          </div>
        )}
      </div>
    </Link>
  )
}
 