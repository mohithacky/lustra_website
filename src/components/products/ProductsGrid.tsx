'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Grid, List, SlidersHorizontal, ChevronDown } from 'lucide-react'
import ProductCard from '@/components/products/ProductCard'
import FilterDrawer from '@/components/products/FilterDrawer'

interface Product {
  id: string
  name: string
  price: string | number | null
  image_url: string | null
  images?: string[] | null
  category?: string | null
  collection?: string | null
  gender?: string | null
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
  trendingCollections: string[]
  productTypes: string[]
  genders?: string[]
  isDemo?: boolean
  initialFilters?: {
    category?: string
    collection?: string
    gender?: string
    productType?: string
  }
}

export default function ProductsGrid({ 
  products, 
  isDark, 
  shopDomain,
  shopId,
  title,
  categories,
  collections,
  trendingCollections,
  productTypes,
  genders = ['Her', 'Him'],
  isDemo = false,
  initialFilters = {},
}: ProductsGridProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<string>('newest')
  const [showFilterDrawer, setShowFilterDrawer] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState<{
    categories: string[]
    collections: string[]
    trendingCollections: string[]
    productTypes: string[]
    genders: string[]
  }>({
    categories: initialFilters.category ? [initialFilters.category] : [],
    collections: initialFilters.collection ? [initialFilters.collection] : [],
    trendingCollections: [],
    productTypes: initialFilters.productType ? [initialFilters.productType] : [],
    genders: initialFilters.gender ? [initialFilters.gender] : [],
  })

  // Handle filter changes
  const handleFilterChange = (filterType: string, value: string) => {
    setSelectedFilters(prev => {
      const currentFilters = prev[filterType as keyof typeof prev]
      const isSelected = currentFilters.includes(value)
      
      return {
        ...prev,
        [filterType]: isSelected
          ? currentFilters.filter(v => v !== value)
          : [...currentFilters, value],
      }
    })
  }

  const handleClearAllFilters = () => {
    setSelectedFilters({
      categories: [],
      collections: [],
      trendingCollections: [],
      productTypes: [],
      genders: [],
    })
  }

  // Filter and sort products with mixed filtering logic
  let filteredProducts = [...products]
  
  // Apply mixed filters - product must match at least one filter from each active filter type
  const hasActiveFilters = 
    selectedFilters.categories.length > 0 ||
    selectedFilters.collections.length > 0 ||
    selectedFilters.trendingCollections.length > 0 ||
    selectedFilters.productTypes.length > 0 ||
    selectedFilters.genders.length > 0

  if (hasActiveFilters) {
    filteredProducts = filteredProducts.filter(product => {
      // Check categories filter
      const matchesCategory = selectedFilters.categories.length === 0 || 
        (product.category && selectedFilters.categories.includes(product.category))
      
      // Check collections filter
      const matchesCollection = selectedFilters.collections.length === 0 || 
        (product.collection && selectedFilters.collections.includes(product.collection))
      
      // Check trending collections filter
      const matchesTrendingCollection = selectedFilters.trendingCollections.length === 0 || 
        (product.collection && selectedFilters.trendingCollections.includes(product.collection))
      
      // Check product types filter - product types are stored in category field
      // Only apply this filter if no category filter is active (to avoid conflict)
      const matchesProductType = selectedFilters.productTypes.length === 0 || 
        (selectedFilters.categories.length === 0 && product.category && selectedFilters.productTypes.includes(product.category))
      
      // Check gender filter
      const matchesGender = selectedFilters.genders.length === 0 || 
        (product.gender && selectedFilters.genders.includes(product.gender))
      
      // Product must match all active filter types (AND logic between types)
      return matchesCategory && matchesCollection && matchesTrendingCollection && matchesProductType && matchesGender
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
            onClick={() => setShowFilterDrawer(true)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              hasActiveFilters && 'ring-2 ring-gold-500',
              isDark 
                ? 'bg-zinc-800 text-white hover:bg-zinc-700' 
                : 'bg-white text-black hover:bg-gray-50 border border-gray-200'
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 px-2 py-0.5 bg-gold-500 text-white text-xs rounded-full">
                {selectedFilters.categories.length + 
                 selectedFilters.collections.length + 
                 selectedFilters.trendingCollections.length + 
                 selectedFilters.productTypes.length + 
                 selectedFilters.genders.length}
              </span>
            )}
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

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className={cn(
            'mb-6 p-4 rounded-xl',
            isDark ? 'bg-zinc-800' : 'bg-white border border-gray-200'
          )}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={cn(
                'text-sm font-semibold',
                isDark ? 'text-white' : 'text-black'
              )}>
                Active Filters
              </h3>
              <button
                onClick={handleClearAllFilters}
                className={cn(
                  'text-xs font-medium transition-colors',
                  isDark ? 'text-gold-400 hover:text-gold-300' : 'text-gold-600 hover:text-gold-700'
                )}
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedFilters.categories.map((cat) => (
                <span
                  key={cat}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium bg-gold-500 text-white flex items-center gap-2'
                  )}
                >
                  {cat}
                  <button
                    onClick={() => handleFilterChange('categories', cat)}
                    className="hover:bg-gold-600 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
              {selectedFilters.collections.map((col) => (
                <span
                  key={col}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium bg-blue-500 text-white flex items-center gap-2'
                  )}
                >
                  {col}
                  <button
                    onClick={() => handleFilterChange('collections', col)}
                    className="hover:bg-blue-600 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
              {selectedFilters.trendingCollections.map((col) => (
                <span
                  key={col}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium bg-purple-500 text-white flex items-center gap-2'
                  )}
                >
                  {col}
                  <button
                    onClick={() => handleFilterChange('trendingCollections', col)}
                    className="hover:bg-purple-600 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
              {selectedFilters.productTypes.map((type) => (
                <span
                  key={type}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium bg-green-500 text-white flex items-center gap-2'
                  )}
                >
                  {type}
                  <button
                    onClick={() => handleFilterChange('productTypes', type)}
                    className="hover:bg-green-600 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
              {selectedFilters.genders.map((gender) => (
                <span
                  key={gender}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium bg-pink-500 text-white flex items-center gap-2'
                  )}
                >
                  {gender}
                  <button
                    onClick={() => handleFilterChange('genders', gender)}
                    className="hover:bg-pink-600 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </span>
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

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={showFilterDrawer}
        onClose={() => setShowFilterDrawer(false)}
        isDark={isDark}
        categories={categories}
        collections={collections}
        trendingCollections={trendingCollections}
        productTypes={productTypes}
        genders={genders}
        selectedFilters={selectedFilters}
        onFilterChange={handleFilterChange}
        onClearAll={handleClearAllFilters}
      />
    </div>
  )
}