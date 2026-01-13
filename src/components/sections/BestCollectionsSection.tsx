'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { cn, getImageUrl } from '@/lib/utils'

interface BestCollection {
  name: string
  image: string
  description?: string
}

interface BestCollectionsSectionProps {
  collections: BestCollection[]
  isDark: boolean
  canEdit?: boolean
  shopDomain?: string
  title?: string
  subtitle?: string
  columns?: number
  showDescription?: boolean
  layout?: string
}

export default function BestCollectionsSection({ 
  collections, 
  isDark, 
  canEdit = false, 
  shopDomain,
  title = "Best Collections",
  subtitle = "Curated selections for every occasion",
  columns = 2,
  showDescription = true,
  layout = "stacked"
}: BestCollectionsSectionProps) {
  const router = useRouter()
  if (!collections.length) return null

  return (
    <section className={cn(
      'py-12 md:py-16 relative',
      isDark ? 'bg-[#080808]' : 'bg-offwhite'
    )}>
      {/* Single Edit Button for Entire Section */}
      {canEdit && (
        <button
          onClick={() => shopDomain && router.push(`/editor/best-collections`)}
          className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-2 bg-white/90 hover:bg-white rounded-full shadow-lg border border-gray-200 transition-all hover:scale-105"
          title="Edit Best Collections"
        >
          <Pencil className="w-4 h-4 text-gray-700" />
          <span className="text-sm font-medium text-gray-700">Edit Section</span>
        </button>
      )}
      
      <div className="max-w-[1100px] mx-auto px-6">
        {/* Section Header - matches Flutter */}
        <div className="text-center mb-10">
          <h2 className={cn(
            'font-display text-2xl font-semibold mb-2',
            isDark ? 'text-white' : 'text-black'
          )}>
            {title}
          </h2>
          {subtitle && (
            <p className={cn(
              'text-sm',
              isDark ? 'text-white/60' : 'text-gray-500'
            )}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Collections - matches Flutter FeaturedCollectionsShowcase layout */}
        <div className="space-y-8">
          {collections.map((collection, index) => (
            <FeaturedCollectionRow
              key={index}
              collection={collection}
              reverse={index % 2 === 1}
              isDark={isDark}
              showDescription={showDescription}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function FeaturedCollectionRow({ collection, reverse, isDark, showDescription = true }: {
  collection: BestCollection
  reverse: boolean
  isDark: boolean
  showDescription?: boolean
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className={cn(
      'flex flex-col md:flex-row gap-6',
      reverse && 'md:flex-row-reverse'
    )}>
      {/* Image Card - matches Flutter _ImageCard */}
      <Link
        href={`/products?collection=${encodeURIComponent(collection.name)}&source=hero-collection`}
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
        {showDescription && collection.description && (
          <p className={cn(
            'text-sm md:text-base leading-relaxed mb-6',
            isDark ? 'text-gray-300' : 'text-gray-700'
          )}>
            {collection.description}
          </p>
        )}
        <Link
          href={`/products?collection=${encodeURIComponent(collection.name)}&source=hero-collection`}
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
 