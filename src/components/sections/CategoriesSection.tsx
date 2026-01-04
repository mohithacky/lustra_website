'use client'

import Image from 'next/image'
import Link from 'next/link'
import { cn, getImageUrl } from '@/lib/utils'
import { Category } from '@/types/database'

interface CategoriesSectionProps {
  categories: Category[]
  isDark: boolean
  shopDomain: string
}

export default function CategoriesSection({ categories, isDark, shopDomain }: CategoriesSectionProps) {
  if (!categories.length) return null

  return (
    <section className={cn(
      'py-16 md:py-24',
      isDark ? 'bg-zinc-900' : 'bg-white'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className={cn(
            'text-xs font-bold tracking-[0.2em] uppercase',
            isDark ? 'text-gray-400' : 'text-gray-500'
          )}>
            Browse By
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-semibold mt-2">
            Categories
          </h2>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/${shopDomain}/categories/${category.name.toLowerCase().replace(/\s+/g, '-')}`}
              className="group flex flex-col items-center"
            >
              <div className={cn(
                'relative w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden mb-3 transition-transform duration-300 group-hover:scale-105',
                isDark ? 'ring-2 ring-zinc-700' : 'ring-2 ring-gray-100'
              )}>
                <Image
                  src={getImageUrl(category.image_url)}
                  alt={category.name}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
                <div className={cn(
                  'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300',
                  'bg-gold-500/20'
                )} />
              </div>
              <h3 className={cn(
                'text-sm font-medium text-center transition-colors',
                isDark 
                  ? 'group-hover:text-gold-400' 
                  : 'group-hover:text-gold-600'
              )}>
                {category.name}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
