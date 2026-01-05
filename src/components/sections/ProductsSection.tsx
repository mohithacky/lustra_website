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
  images?: string[]
  category?: string
  weight?: string
  is_bestseller?: boolean
  is_trending?: boolean
}

interface ProductsSectionProps {
  products: Product[]
  isDark: boolean
  title: string
  shopDomain: string
}

export default function ProductsSection({ products, isDark, title, shopDomain }: ProductsSectionProps) {
  if (!products.length) return null

  return (
    <section className={cn(
      'py-12 md:py-16',
      isDark ? 'bg-[#080808]' : 'bg-offwhite'
    )}>
      <div className="max-w-[1100px] mx-auto px-6">
        {/* Section Header - matches Flutter ProductShowcase */}
        <div className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <span className={cn(
              'text-xs font-bold tracking-[0.15em] uppercase',
              isDark ? 'text-white/70' : 'text-gray-500'
            )}>
              NEW ARRIVALS
            </span>
            <h2 className={cn(
              'font-display text-2xl font-semibold mt-2',
              isDark ? 'text-white' : 'text-black'
            )}>
              {title}
            </h2>
          </div>
          <Link 
            href={`/${shopDomain}/products`}
            className={cn(
              'text-sm font-semibold transition-colors',
              isDark ? 'text-gold-400 hover:text-gold-300' : 'text-gold-600 hover:text-gold-700'
            )}
          >
            View All →
          </Link>
        </div>

        {/* Products - horizontal scroll like Flutter */}
        <div className="overflow-x-auto pb-4 -mx-6 px-6">
          <div className="flex gap-4 min-w-max">
            {products.slice(0, 10).map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
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

function ProductCard({ product, isDark, shopDomain }: { 
  product: Product
  isDark: boolean
  shopDomain: string
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Link 
      href={`/${shopDomain}/products/${product.id}`}
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
          <Image
            src={getImageUrl(product.image_url)}
            alt={product.name}
            fill
            className="object-cover"
            sizes="230px"
          />
        </div>

        {/* Product Info - matches Flutter padding and styling */}
        <div className="p-3.5">
          <h3 className="font-semibold text-sm text-black line-clamp-1 mb-1.5">
            {product.name}
          </h3>
          <p className="font-bold text-black">
            {formatPrice(product.price)}
          </p>
        </div>
      </div>
    </Link>
  )
}
