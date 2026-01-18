'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn, getImageUrl, formatPrice } from '@/lib/utils'

interface Product {
  id: string
  name: string
  price: string | number | null
  image_url: string | null
  images?: string[] | null
}

interface TrendingProductsSectionProps {
  products: Product[]
  isDark: boolean
  title?: string
  subtitle?: string
  limit?: number
  showPrice?: boolean
  layout?: string
  shopDomain: string
}

export default function TrendingProductsSection({ 
  products, 
  isDark, 
  title = "Trending Now",
  subtitle = "Most popular this week",
  limit = 10,
  showPrice = true,
  layout = "carousel",
  shopDomain 
}: TrendingProductsSectionProps) {
  if (!products.length) return null

  const displayProducts = products.slice(0, limit)

  return (
    <section className={cn(
      'py-12',
      isDark ? 'bg-[#080808]' : 'bg-offwhite'
    )}>
      <div className="max-w-[1100px] mx-auto">
        {/* Section Header - matches Flutter TrendingProductsShowcase */}
        <div className="text-center px-6 mb-6">
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
          <div className="flex justify-end mt-2 px-6">
            <Link 
              href={`/products?filter=trending`}
              className={cn(
                'text-sm font-semibold transition-colors',
                isDark ? 'text-gold-400 hover:text-gold-300' : 'text-gold-600 hover:text-gold-700'
              )}
            >
              View All →
            </Link>
          </div>
        </div>

        {/* Products - horizontal scroll with height 330px like Flutter */}
        <div className="overflow-x-auto pb-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="flex gap-4 px-6 min-w-max">
            {displayProducts.map((product) => (
              <TrendingProductCard 
                key={product.id} 
                product={product} 
                isDark={isDark}
                showPrice={showPrice}
                shopDomain={shopDomain}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function TrendingProductCard({ product, isDark, showPrice = true, shopDomain }: { 
  product: Product
  isDark: boolean
  showPrice?: boolean
  shopDomain: string
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Link 
      href={`/products/${product.id}`}
      className="block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card height 330px to match Flutter, width 230px */}
      <div 
        className={cn(
          'w-[230px] h-[330px] rounded-xl overflow-hidden transition-all duration-300',
          'bg-white shadow-lg flex flex-col',
          isHovered && 'shadow-xl -translate-y-1.5'
        )}
      >
        {/* Image - 60% height like Flutter */}
        <div className="relative h-[60%] overflow-hidden">
          {product.images && product.images.length > 1 ? (
            <>
              <Image
                src={getImageUrl(product.images[0])}
                alt={product.name}
                fill
                className={cn(
                  "object-cover transition-opacity duration-300",
                  isHovered ? "opacity-0" : "opacity-100"
                )}
                sizes="230px"
              />
              <Image
                src={getImageUrl(product.images[1])}
                alt={`${product.name} - alternate view`}
                fill
                className={cn(
                  "object-cover transition-opacity duration-300",
                  isHovered ? "opacity-100" : "opacity-0"
                )}
                sizes="230px"
              />
            </>
          ) : (
            <Image
              src={getImageUrl(product.image_url)}
              alt={product.name}
              fill
              className="object-cover"
              sizes="230px"
            />
          )}
        </div>

        {/* Product Info */}
        <div className="p-3.5 flex-1 flex flex-col justify-center">
          <h3 className="font-semibold text-sm text-black line-clamp-1 mb-1.5">
            {product.name}
          </h3>
          {showPrice && (
            <p className="font-bold text-black">
              {formatPrice(product.price)}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
 