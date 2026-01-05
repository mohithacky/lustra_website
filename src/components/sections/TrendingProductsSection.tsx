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
  shopDomain: string
}

export default function TrendingProductsSection({ products, isDark, shopDomain }: TrendingProductsSectionProps) {
  if (!products.length) return null

  return (
    <section className={cn(
      'py-12',
      isDark ? 'bg-[#080808]' : 'bg-offwhite'
    )}>
      <div className="max-w-[1100px] mx-auto">
        {/* Section Header - matches Flutter TrendingProductsShowcase */}
        <div className="text-center px-6 mb-6">
          <span className={cn(
            'text-xs font-bold tracking-[0.15em] uppercase',
            isDark ? 'text-white/70' : 'text-gray-500'
          )}>
            TRENDING PRODUCTS
          </span>
          <h2 className={cn(
            'font-display text-2xl font-semibold mt-2',
            isDark ? 'text-white' : 'text-black'
          )}>
            Discover what shoppers are loving right now
          </h2>
          <div className="flex justify-end mt-2 px-6">
            <Link 
              href={`/${shopDomain}/products?filter=trending`}
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
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 px-6 min-w-max">
            {products.slice(0, 10).map((product) => (
              <TrendingProductCard 
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

function TrendingProductCard({ product, isDark, shopDomain }: { 
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
          <Image
            src={getImageUrl(product.image_url)}
            alt={product.name}
            fill
            className="object-cover"
            sizes="230px"
          />
        </div>

        {/* Product Info */}
        <div className="p-3.5 flex-1 flex flex-col justify-center">
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
