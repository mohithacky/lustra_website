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
  collection?: string | string[] | null
  type?: string | null
  product_type?: string | null
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
  source?: string
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
  source,
  initialFilters = {},
}: ProductsGridProps) {
  // Debug: Log available filters
  console.log('[ProductsGrid] Available filters:', {
    collections,
    trendingCollections,
    categories,
    productTypes,
    genders
  })
  
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
      
      // Check collections filter - collection can be string or array
      const productCollections = Array.isArray(product.collection) ? product.collection : (product.collection ? [product.collection] : [])
      const matchesCollection = selectedFilters.collections.length === 0 || 
        productCollections.some(c => selectedFilters.collections.includes(c))
      
      // Check trending collections filter - collection can be string or array
      const matchesTrendingCollection = selectedFilters.trendingCollections.length === 0 || 
        productCollections.some(c => selectedFilters.trendingCollections.includes(c))
      
      // Debug logging for first product
      if (product.id && selectedFilters.collections.length > 0 && productCollections.length > 0) {
        console.log('[Filter Debug]', {
          productName: product.name,
          productCollections,
          selectedCollections: selectedFilters.collections,
          matchesCollection
        })
      }
      
      // Check product types filter - check both type and product_type fields
      const matchesProductType = selectedFilters.productTypes.length === 0 || 
        ((product.type && selectedFilters.productTypes.includes(product.type)) ||
         (product.product_type && selectedFilters.productTypes.includes(product.product_type)))
      
      // Check gender filter - gender can be in gender field OR in collection array
      const matchesGender = selectedFilters.genders.length === 0 || 
        (product.gender && selectedFilters.genders.includes(product.gender)) ||
        (product.collection && (
          Array.isArray(product.collection)
            ? product.collection.some(c => selectedFilters.genders.includes(c))
            : selectedFilters.genders.includes(product.collection)
        ))
      
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
      'min-h-screen pb-20',
      isDark ? 'bg-[#080808]' : 'bg-offwhite'
    )}>
      <div className="max-w-[1200px] mx-auto px-6 pt-6">
        {/* Page Header - matches Flutter ProductsPage */}
        <div className="mb-6">
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

      {/* Bottom Sticky Bar - matches reference image */}
      <div className={cn(
        'fixed bottom-0 left-0 right-0 z-50 border-t',
        isDark ? 'bg-[#121212] border-zinc-800' : 'bg-white border-gray-200'
      )}>
        <div className="max-w-[1200px] mx-auto px-6 py-3">
          <div className="flex items-center justify-center gap-4">
            {/* Sort By Button */}
            <button
              onClick={() => {
                const nextSort = sortBy === 'newest' ? 'price-low' : sortBy === 'price-low' ? 'price-high' : 'newest'
                setSortBy(nextSort)
              }}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-colors border',
                isDark 
                  ? 'bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700' 
                  : 'bg-white text-black border-gray-300 hover:bg-gray-50'
              )}
            >
              <ChevronDown className="w-4 h-4" />
              Sort By
            </button>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilterDrawer(true)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-colors border',
                hasActiveFilters && 'ring-2 ring-gold-500',
                isDark 
                  ? 'bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700' 
                  : 'bg-white text-black border-gray-300 hover:bg-gray-50'
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filter
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
          </div>
        </div>
      </div>

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={showFilterDrawer}
        onClose={() => setShowFilterDrawer(false)}
        isDark={isDark}
        source={source}
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