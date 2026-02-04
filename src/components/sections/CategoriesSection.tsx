'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Edit } from 'lucide-react'
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
  canEdit?: boolean
  title?: string
  layout?: string
  columns?: number
  showTitle?: boolean
  imageStyle?: string
}

export default function CategoriesSection({ 
  categories, 
  isDark, 
  shopDomain, 
  canEdit = false,
  title = "Shop by Category",
  layout = "carousel",
  columns = 4,
  showTitle = true,
  imageStyle = "circle"
}: CategoriesSectionProps) {
  const router = useRouter()
  
  if (!categories.length) return null

  return (
    <section className={cn(
      'py-4',
      isDark ? 'bg-black' : 'bg-transparent'
    )}>
      <div className="mx-auto">
        {/* Section Header - matches Flutter */}
        {showTitle && (
          <div className="text-center mb-6 relative">
            <span className={cn(
              'text-xs font-bold tracking-[0.15em] uppercase',
              isDark ? 'text-white/70' : 'text-gray-500'
            )}>
              {title}
            </span>
            {/* Edit button */}
            {canEdit && (
              <button
                onClick={() => router.push(`/editor/categories`)}
                className={cn(
                  'absolute right-6 top-0 p-2 rounded-full transition-colors',
                  isDark ? 'hover:bg-zinc-800 text-white' : 'hover:bg-gray-100 text-black'
                )}
                title="Edit Categories"
              >
                <Edit className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Categories - horizontal scroll matching Flutter CategoryCarousel */}
        {/* Flutter heights: mobile 130px, tablet 230px, desktop 260px */}
        <div className="h-[130px] md:h-[230px] lg:h-[260px] overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="flex gap-2.5 h-full px-6 min-w-max">
            {categories.map((category) => (
              <CategoryItem
                key={category.id}
                category={category}
                isDark={isDark}
                shopDomain={shopDomain}
                imageStyle={imageStyle}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function CategoryItem({ category, isDark, shopDomain, imageStyle = "circle" }: {
  category: Category
  isDark: boolean
  shopDomain: string
  imageStyle?: string
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Link
      href={`/products?category=${encodeURIComponent(category.name)}&source=category`}
      className="flex flex-col items-center justify-center mx-1.5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image - Flutter sizes: mobile 90px, tablet 110px, desktop 220px */}
      <div 
        className={cn(
          'relative overflow-hidden transition-transform duration-200',
          'w-[90px] h-[90px] md:w-[110px] md:h-[110px] lg:w-[220px] lg:h-[220px]',
          imageStyle === 'circle' ? 'rounded-full' : 'rounded-xl',
          isHovered && 'scale-105'
        )}
      >
        <Image
          src={getImageUrl(category.image_url)}
          alt={category.name}
          fill
          className="object-cover"
          sizes="(max-width: 600px) 90px, (max-width: 1024px) 110px, 220px"
          unoptimized
        />
      </div>
      
      {/* Category name */}
      <h3 className={cn(
        'mt-1.5 text-[13px] text-center max-w-[90px] md:max-w-[110px] lg:max-w-[220px] truncate transition-all',
        isDark ? 'text-white' : 'text-gray-800',
        isHovered ? 'font-bold' : 'font-medium'
      )}>
        {category.name}
      </h3>
    </Link>
  )
}
 