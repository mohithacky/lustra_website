'use client'

import Image from 'next/image'
import Link from 'next/link'
import { cn, getImageUrl } from '@/lib/utils'

interface Category {
  id: string
  name: string
  image_url: string | null
}

interface CategoriesSectionProps {
  categories: Category[]
  isDark: boolean
  shopDomain: string
}

export default function CategoriesSection({ categories, isDark, shopDomain }: CategoriesSectionProps) {
  if (!categories.length) return null

  return (
    <section className={cn(
      'py-10',
      isDark ? 'bg-[#080808]' : 'bg-offwhite'
    )}>
      <div className="max-w-[1100px] mx-auto px-6">
        {/* Section Header - matches Flutter */}
        <div className="text-center mb-8">
          <span className={cn(
            'text-xs font-bold tracking-[0.15em] uppercase',
            isDark ? 'text-white/70' : 'text-gray-500'
          )}>
            SHOP BY CATEGORY
          </span>
          <h2 className={cn(
            'font-display text-2xl font-semibold mt-2',
            isDark ? 'text-white' : 'text-black'
          )}>
            Categories
          </h2>
        </div>

        {/* Categories - horizontal scroll like Flutter */}
        <div className="overflow-x-auto pb-4 -mx-6 px-6">
          <div className="flex gap-6 md:gap-8 min-w-max md:justify-center">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/${shopDomain}/categories/${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="group flex flex-col items-center"
              >
                {/* Circular image - matches Flutter CategoryCarousel */}
                <div className={cn(
                  'relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden mb-3',
                  'transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg',
                  isDark ? 'ring-2 ring-zinc-700' : 'ring-2 ring-gray-200'
                )}>
                  <Image
                    src={getImageUrl(category.image_url)}
                    alt={category.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-gold-500/20 transition-colors duration-300" />
                </div>
                <h3 className={cn(
                  'text-xs md:text-sm font-medium text-center transition-colors',
                  isDark 
                    ? 'text-white group-hover:text-gold-400' 
                    : 'text-black group-hover:text-gold-600'
                )}>
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
