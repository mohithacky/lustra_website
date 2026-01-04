'use client'

import Image from 'next/image'
import Link from 'next/link'
import { cn, getImageUrl } from '@/lib/utils'
import { BestCollection } from '@/types/database'

interface BestCollectionsSectionProps {
  collections: BestCollection[]
  isDark: boolean
}

export default function BestCollectionsSection({ collections, isDark }: BestCollectionsSectionProps) {
  if (!collections.length) return null

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
            Curated For You
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-semibold mt-2">
            Best Collections
          </h2>
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {collections.map((collection, index) => (
            <Link
              key={index}
              href={`/collections/${collection.name.toLowerCase().replace(/\s+/g, '-')}`}
              className={cn(
                'group relative overflow-hidden rounded-2xl aspect-[4/5]',
                isDark ? 'bg-zinc-900' : 'bg-white shadow-lg'
              )}
            >
              <Image
                src={getImageUrl(collection.image)}
                alt={collection.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className={cn(
                'absolute inset-0',
                'bg-gradient-to-t from-black/70 via-black/20 to-transparent'
              )} />
              
              {/* Content */}
              <div className="absolute inset-x-0 bottom-0 p-6">
                <h3 className="font-display text-2xl text-white font-semibold mb-2">
                  {collection.name}
                </h3>
                {collection.description && (
                  <p className="text-white/70 text-sm line-clamp-2 mb-4">
                    {collection.description}
                  </p>
                )}
                <span className="inline-flex items-center text-gold-400 text-sm font-medium group-hover:text-gold-300 transition-colors">
                  Explore Collection
                  <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
