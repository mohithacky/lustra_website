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
  category?: string | null
  weight?: string | null
  is_bestseller?: boolean | null
  is_trending?: boolean | null
}

interface ProductsSectionProps {
  products: Product[]
  isDark: boolean
  title?: string
  subtitle?: string
  limit?: number
  columns?: number
  showPrice?: boolean
  shopDomain: string
}

export default function ProductsSection({ 
  products, 
  isDark, 
  title = "New Arrivals",
  subtitle = "Discover our latest collection",
  limit = 12,
  columns = 4,
  showPrice = true,
  shopDomain 
}: ProductsSectionProps) {
  if (!products.length) return null

  // Limit products based on config
  const displayProducts = products.slice(0, limit)

  return (
    <section className={cn(
      'py-12 md:py-16',
      isDark ? 'bg-[#080808]' : 'bg-offwhite'
    )}>
      <div className="max-w-[1100px] mx-auto px-6">
        {/* Section Header - matches Flutter ProductShowcase */}
        <div className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
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
          <Link 
            href={`/products`}
            className={cn(
              'text-sm font-semibold transition-colors',
              isDark ? 'text-gold-400 hover:text-gold-300' : 'text-gold-600 hover:text-gold-700'
            )}
          >
            View All →
          </Link>
        </div>

        {/* Products - horizontal scroll like Flutter */}
        <div className="overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="flex gap-4 min-w-max">
            {displayProducts.map((product) => (
              <ProductCard 
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

function ProductCard({ product, isDark, showPrice = true, shopDomain }: { 
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
      <div 
        className={cn(
          'w-[230px] rounded-xl overflow-hidden transition-all duration-300',
          'bg-white shadow-lg',
          isHovered && 'shadow-xl -translate-y-1.5'
        )}
      >
        {/* Image - 60% height like Flutter */}
        <div className="relative h-[200px] overflow-hidden">
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
                unoptimized
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
                unoptimized
              />
            </>
          ) : (
            <Image
              src={getImageUrl(product.image_url)}
              alt={product.name}
              fill
              className="object-cover"
              sizes="230px"
              unoptimized
            />
          )}
        </div>

        {/* Product Info - matches Flutter padding and styling */}
        <div className="p-3.5">
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
 