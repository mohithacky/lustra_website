'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn, getImageUrl, formatPrice } from '@/lib/utils'
import { ChevronDown, Grid, List, SlidersHorizontal } from 'lucide-react'

interface Product {
  id: string
  name: string
  price: string | number | null
  image_url: string | null
  images?: string[] | null
  category?: string | null
  collection?: string | null
  weight?: string | null
  is_bestseller?: boolean | null
  is_trending?: boolean | null
}

interface ProductsGridProps {
  products: Product[]
  isDark: boolean
  shopDomain: string
  title: string
  categories: string[]
  collections: string[]
}

export default function ProductsGrid({ 
  products, 
  isDark, 
  shopDomain, 
  title,
  categories,
  collections 
}: ProductsGridProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<string>('newest')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Filter and sort products
  let filteredProducts = [...products]
  
  if (selectedCategory) {
    filteredProducts = filteredProducts.filter(p => p.category === selectedCategory)
  }

  // Sort products
  if (sortBy === 'price-low') {
    filteredProducts.sort((a, b) => {
      const priceA = typeof a.price === 'number' ? a.price : parseFloat(String(a.price).replace(/[^0-9.]/g, '')) || 0
      const priceB = typeof b.price === 'number' ? b.price : parseFloat(String(b.price).replace(/[^0-9.]/g, '')) || 0
      return priceA - priceB
    })
  } else if (sortBy === 'price-high') {
    filteredProducts.sort((a, b) => {
      const priceA = typeof a.price === 'number' ? a.price : parseFloat(String(a.price).replace(/[^0-9.]/g, '')) || 0
      const priceB = typeof b.price === 'number' ? b.price : parseFloat(String(b.price).replace(/[^0-9.]/g, '')) || 0
      return priceB - priceA
    })
  }

  return (
    <div className={cn(
      'min-h-screen py-8',
      isDark ? 'bg-[#080808]' : 'bg-offwhite'
    )}>
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Page Header - matches Flutter ProductsPage */}
        <div className="mb-8">
          <h1 className={cn(
            'font-display text-2xl md:text-3xl font-bold',
            isDark ? 'text-white' : 'text-black'
          )}>
            {title}
          </h1>
          <p className={cn(
            'text-sm mt-2',
            isDark ? 'text-gray-400' : 'text-gray-500'
          )}>
            {filteredProducts.length} products
          </p>
        </div>

        {/* Filters Bar */}
        <div className={cn(
          'flex items-center justify-between mb-6 pb-4 border-b',
          isDark ? 'border-zinc-800' : 'border-gray-200'
        )}>
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              isDark 
                ? 'bg-zinc-800 text-white hover:bg-zinc-700' 
                : 'bg-white text-black hover:bg-gray-50 border border-gray-200'
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>

          <div className="flex items-center gap-4">
            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={cn(
                  'appearance-none px-4 py-2 pr-8 rounded-lg text-sm font-medium cursor-pointer',
                  isDark 
                    ? 'bg-zinc-800 text-white' 
                    : 'bg-white text-black border border-gray-200'
                )}
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <ChevronDown className={cn(
                'absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none',
                isDark ? 'text-gray-400' : 'text-gray-500'
              )} />
            </div>

            {/* View Mode Toggle */}
            <div className={cn(
              'flex rounded-lg overflow-hidden',
              isDark ? 'bg-zinc-800' : 'bg-white border border-gray-200'
            )}>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 transition-colors',
                  viewMode === 'grid'
                    ? 'bg-gold-500 text-white'
                    : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'
                )}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 transition-colors',
                  viewMode === 'list'
                    ? 'bg-gold-500 text-white'
                    : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className={cn(
            'mb-6 p-4 rounded-xl',
            isDark ? 'bg-zinc-800' : 'bg-white border border-gray-200'
          )}>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  !selectedCategory
                    ? 'bg-gold-500 text-white'
                    : isDark ? 'bg-zinc-700 text-white' : 'bg-gray-100 text-black'
                )}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                    selectedCategory === cat
                      ? 'bg-gold-500 text-white'
                      : isDark ? 'bg-zinc-700 text-white' : 'bg-gray-100 text-black'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid - matches Flutter MasonryGridView */}
        {filteredProducts.length > 0 ? (
          <div className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
              : 'flex flex-col gap-4'
          )}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isDark={isDark}
                shopDomain={shopDomain}
                viewMode={viewMode}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className={cn(
              'text-lg',
              isDark ? 'text-gray-400' : 'text-gray-500'
            )}>
              No products found
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function ProductCard({ product, isDark, shopDomain, viewMode }: {
  product: Product
  isDark: boolean
  shopDomain: string
  viewMode: 'grid' | 'list'
}) {
  const [isHovered, setIsHovered] = useState(false)

  if (viewMode === 'list') {
    return (
      <Link
        href={`/${shopDomain}/products/${product.id}`}
        className={cn(
          'flex gap-4 p-4 rounded-xl transition-shadow',
          isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-white hover:shadow-lg'
        )}
      >
        <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
          <Image
            src={getImageUrl(product.image_url)}
            alt={product.name}
            fill
            className="object-cover"
            sizes="96px"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            'font-semibold text-sm truncate',
            isDark ? 'text-white' : 'text-black'
          )}>
            {product.name}
          </h3>
          {product.category && (
            <p className={cn(
              'text-xs mt-1',
              isDark ? 'text-gray-400' : 'text-gray-500'
            )}>
              {product.category}
            </p>
          )}
          <p className={cn(
            'font-bold mt-2',
            isDark ? 'text-gold-400' : 'text-gold-600'
          )}>
            {formatPrice(product.price)}
          </p>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/${shopDomain}/products/${product.id}`}
      className="block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className={cn(
          'rounded-xl overflow-hidden transition-all duration-300',
          'bg-white shadow-md',
          isHovered && 'shadow-xl -translate-y-1'
        )}
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={getImageUrl(product.image_url)}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          {/* Badges */}
          {(product.is_bestseller || product.is_trending) && (
            <div className="absolute top-2 left-2">
              {product.is_bestseller && (
                <span className="bg-gold-500 text-white text-xs px-2 py-1 rounded-full">
                  Bestseller
                </span>
              )}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="font-semibold text-sm text-black line-clamp-1 mb-1">
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
