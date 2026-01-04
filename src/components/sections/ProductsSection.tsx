'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Heart, ShoppingBag } from 'lucide-react'
import { cn, getImageUrl, formatPrice } from '@/lib/utils'
import { Product } from '@/types/database'

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
      'py-16 md:py-24',
      isDark ? 'bg-zinc-900' : 'bg-white'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <span className={cn(
              'text-xs font-bold tracking-[0.2em] uppercase',
              isDark ? 'text-gray-400' : 'text-gray-500'
            )}>
              Shop
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-semibold mt-2">
              {title}
            </h2>
          </div>
          <Link 
            href={`/${shopDomain}/products`}
            className={cn(
              'hidden sm:inline-flex items-center gap-2 text-sm font-medium transition-colors',
              isDark ? 'text-gold-400 hover:text-gold-300' : 'text-gold-600 hover:text-gold-700'
            )}
          >
            View All
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              isDark={isDark}
              shopDomain={shopDomain}
            />
          ))}
        </div>

        {/* Mobile View All */}
        <div className="mt-8 text-center sm:hidden">
          <Link 
            href={`/${shopDomain}/products`}
            className="btn-gold rounded-full inline-block"
          >
            View All Products
          </Link>
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
  return (
    <div className={cn(
      'group product-card rounded-xl overflow-hidden',
      isDark ? 'bg-zinc-800' : 'bg-white shadow-md'
    )}>
      <Link href={`/${shopDomain}/products/${product.id}`}>
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={getImageUrl(product.image_url)}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.is_bestseller && (
              <span className="bg-gold-500 text-white text-xs px-2 py-1 rounded-full">
                Bestseller
              </span>
            )}
            {product.is_trending && (
              <span className={cn(
                'text-xs px-2 py-1 rounded-full',
                isDark ? 'bg-white text-black' : 'bg-black text-white'
              )}>
                Trending
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              className={cn(
                'p-2 rounded-full transition-colors',
                isDark 
                  ? 'bg-zinc-700 hover:bg-gold-500 text-white' 
                  : 'bg-white hover:bg-gold-500 hover:text-white shadow-md'
              )}
              aria-label="Add to wishlist"
            >
              <Heart className="w-4 h-4" />
            </button>
            <button 
              className={cn(
                'p-2 rounded-full transition-colors',
                isDark 
                  ? 'bg-zinc-700 hover:bg-gold-500 text-white' 
                  : 'bg-white hover:bg-gold-500 hover:text-white shadow-md'
              )}
              aria-label="Add to cart"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-4">
        <Link href={`/${shopDomain}/products/${product.id}`}>
          <h3 className={cn(
            'font-medium text-sm md:text-base line-clamp-2 mb-1 group-hover:text-gold-500 transition-colors',
            isDark ? 'text-white' : 'text-black'
          )}>
            {product.name}
          </h3>
        </Link>
        
        {product.category && (
          <p className={cn(
            'text-xs mb-2',
            isDark ? 'text-gray-400' : 'text-gray-500'
          )}>
            {product.category}
          </p>
        )}

        <div className="flex items-center justify-between">
          <span className={cn(
            'font-semibold',
            isDark ? 'text-gold-400' : 'text-gold-600'
          )}>
            {formatPrice(product.price)}
          </span>
          
          {product.weight && (
            <span className={cn(
              'text-xs',
              isDark ? 'text-gray-400' : 'text-gray-500'
            )}>
              {product.weight}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
