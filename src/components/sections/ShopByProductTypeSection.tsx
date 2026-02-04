'use client'

import Image from 'next/image'
import Link from 'next/link'
import { cn, getImageUrl } from '@/lib/utils'

interface ProductTypeCollection {
  id: string
  user_id: string
  name: string
  slug: string | null
  collection_label: string
  image_url: string | null
  display_order: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

interface ShopByProductTypeSectionProps {
  productTypes: ProductTypeCollection[]
  isDark: boolean
  shopDomain: string
  title?: string
  subtitle?: string
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

        {/* Product Types - Mobile: horizontal scroll, Desktop: flex-wrap */}
        <div className={cn(
          "md:flex md:flex-wrap md:justify-center md:gap-6 lg:gap-8 overflow-x-auto md:overflow-x-visible scrollbar-hide px-4 md:px-0"
        )}>
          <div className={cn(
            "flex gap-4 md:contents",
            productTypes.length === 2 && "mx-auto justify-center w-full"
          )}>
            {productTypes.map((productType) => (
              <ProductTypeCard
                key={productType.id}
                productType={productType}
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

interface ProductTypeCardProps {
  productType: ProductTypeCollection
  isDark: boolean
  shopDomain: string
}

function ProductTypeCard({ productType, isDark, shopDomain }: ProductTypeCardProps) {
  return (
    <Link
      href={`/products?productType=${encodeURIComponent(productType.name)}&source=product-type`}
      className="group flex flex-col items-center"
    >
      <div className="relative w-32 h-32 md:w-48 md:h-48 lg:w-64 lg:h-64 rounded-xl overflow-hidden shadow-lg transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl">
        <Image
          src={getImageUrl(productType.image_url || '')}
          alt={productType.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 128px, (max-width: 1024px) 192px, 256px"
          unoptimized
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <p className={cn(
        'mt-3 text-sm md:text-base font-medium transition-colors duration-200',
        isDark ? 'text-white group-hover:text-gold-400' : 'text-gray-800 group-hover:text-gold-600'
      )}>
        {productType.name}
      </p>
    </Link>
  )
}
 