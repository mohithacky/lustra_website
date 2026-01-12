'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Grid, List, SlidersHorizontal, ChevronDown } from 'lucide-react'
import ProductCard from '@/components/products/ProductCard'

interface Product {
  id: string
  name: string
  price: string | number | null
  image_url: string | null
  images?: string[] | null
  category?: string | null
  collection?: string | string[] | null
  weight?: string | null
  is_bestseller?: boolean | null
  is_trending?: boolean | null
  is_demo?: boolean
}

interface ProductsGridProps {
  products: Product[]
  isDark: boolean
  shopDomain: string
  shopId: string
  title: string
  categories: string[]
  collections: string[]
  isDemo?: boolean
}

export default function ProductsGrid({ 
  products, 
  isDark, 
  shopDomain,
  shopId,
  title,
  categories,
  collections,
  isDemo = false
}: ProductsGridProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<string>('newest')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Extract unique product types from products
  const productTypes = Array.from(new Set(
    products
      .map(p => p.category)
      .filter((cat): cat is string => cat !== null && cat !== undefined)
  ))

  // Filter and sort products
  let filteredProducts = [...products]
  
  if (selectedCategory) {
    filteredProducts = filteredProducts.filter(p => p.category === selectedCategory)
  }
  
  if (selectedCollection) {
    filteredProducts = filteredProducts.filter(p => {
      if (typeof p.collection === 'string') {
        return p.collection === selectedCollection
      } else if (Array.isArray(p.collection)) {
        return p.collection.includes(selectedCollection)
      }
      return false
    })
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
            'mb-6 p-6 rounded-xl space-y-6',
            isDark ? 'bg-zinc-800' : 'bg-white border border-gray-200'
          )}>
            {/* Categories Filter */}
            {categories.length > 0 && (
              <div>
                <h3 className={cn(
                  'text-sm font-semibold mb-3',
                  isDark ? 'text-gray-300' : 'text-gray-700'
                )}>
                  Categories
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                      !selectedCategory
                        ? 'bg-gold-500 text-white'
                        : isDark ? 'bg-zinc-700 text-white hover:bg-zinc-600' : 'bg-gray-100 text-black hover:bg-gray-200'
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
                          : isDark ? 'bg-zinc-700 text-white hover:bg-zinc-600' : 'bg-gray-100 text-black hover:bg-gray-200'
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Collections Filter */}
            {collections.length > 0 && (
              <div>
                <h3 className={cn(
                  'text-sm font-semibold mb-3',
                  isDark ? 'text-gray-300' : 'text-gray-700'
                )}>
                  Collections
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCollection(null)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                      !selectedCollection
                        ? 'bg-gold-500 text-white'
                        : isDark ? 'bg-zinc-700 text-white hover:bg-zinc-600' : 'bg-gray-100 text-black hover:bg-gray-200'
                    )}
                  >
                    All
                  </button>
                  {collections.map((col) => (
                    <button
                      key={col}
                      onClick={() => setSelectedCollection(col)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                        selectedCollection === col
                          ? 'bg-gold-500 text-white'
                          : isDark ? 'bg-zinc-700 text-white hover:bg-zinc-600' : 'bg-gray-100 text-black hover:bg-gray-200'
                      )}
                    >
                      {col}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Product Types Filter (extracted from products) */}
            {productTypes.length > 0 && (
              <div>
                <h3 className={cn(
                  'text-sm font-semibold mb-3',
                  isDark ? 'text-gray-300' : 'text-gray-700'
                )}>
                  Product Types
                </h3>
                <div className="flex flex-wrap gap-2">
                  {productTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedCategory(type)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                        selectedCategory === type
                          ? 'bg-gold-500 text-white'
                          : isDark ? 'bg-zinc-700 text-white hover:bg-zinc-600' : 'bg-gray-100 text-black hover:bg-gray-200'
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
                shopId={shopId}
                isDemo={isDemo || product.is_demo}
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

 