'use client'

import Image from 'next/image'
import Link from 'next/link'
import { cn, getImageUrl } from '@/lib/utils'

interface ShopByProductTypeSectionProps {
  productTypes: string[]
  isDark: boolean
  shopDomain: string
  title?: string
  subtitle?: string
}

// Default images for product types (matching Flutter implementation)
const SUPABASE_BASE = 'https://phlccyxgyftspxnuzttf.supabase.co/storage/v1/object/public/default-categories'

function getImageForType(type: string): string {
  switch (type.toLowerCase()) {
    case 'gold':
      return `${SUPABASE_BASE}/gold.jpeg`
    case 'silver':
      return `${SUPABASE_BASE}/silver.jpeg`
    case 'diamond':
      return `${SUPABASE_BASE}/diamond.jpeg`
    case 'platinum':
      return `${SUPABASE_BASE}/platinum.jpeg`
    default:
      return `${SUPABASE_BASE}/gold.jpeg`
  }
}

export default function ShopByProductTypeSection({
  productTypes,
  isDark,
  shopDomain,
  title = 'SHOP BY PRODUCT TYPE',
  subtitle = 'Explore pieces by what you sell most',
}: ShopByProductTypeSectionProps) {
  // Only show if there are multiple product types (matching Flutter behavior)
  if (!productTypes || productTypes.length <= 1) {
    return null
  }

  return (
    <section className={cn(
      'py-12 md:py-16',
      isDark ? 'bg-black' : 'bg-gray-50'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-8">
          <p className={cn(
            'text-xs tracking-[0.2em] uppercase mb-2',
            isDark ? 'text-gray-400' : 'text-gray-500'
          )}>
            {title}
          </p>
          <h2 className={cn(
            'font-display text-2xl md:text-3xl font-semibold',
            isDark ? 'text-white' : 'text-gray-900'
          )}>
            {subtitle}
          </h2>
        </div>

        {/* Product Types Grid */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-8">
          {productTypes.map((type) => (
            <ProductTypeCard
              key={type}
              type={type}
              imageUrl={getImageForType(type)}
              isDark={isDark}
              shopDomain={shopDomain}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

interface ProductTypeCardProps {
  type: string
  imageUrl: string
  isDark: boolean
  shopDomain: string
}

function ProductTypeCard({ type, imageUrl, isDark, shopDomain }: ProductTypeCardProps) {
  return (
    <Link
      href={`/${shopDomain}/product-type/${encodeURIComponent(type.toLowerCase())}`}
      className="group flex flex-col items-center"
    >
      <div className="relative w-32 h-32 md:w-48 md:h-48 lg:w-64 lg:h-64 rounded-xl overflow-hidden shadow-lg transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl">
        <Image
          src={getImageUrl(imageUrl)}
          alt={type}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 128px, (max-width: 1024px) 192px, 256px"
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <p className={cn(
        'mt-3 text-sm md:text-base font-medium transition-colors duration-200',
        isDark ? 'text-white group-hover:text-gold-400' : 'text-gray-800 group-hover:text-gold-600'
      )}>
        {type}
      </p>
    </Link>
  )
}
