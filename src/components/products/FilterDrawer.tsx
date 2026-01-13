'use client'

import { useState } from 'react'
import { X, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FilterDrawerProps {
  isOpen: boolean
  onClose: () => void
  isDark: boolean
  source?: string
  categories: string[]
  collections: string[]
  trendingCollections: string[]
  productTypes: string[]
  genders: string[]
  selectedFilters: {
    categories: string[]
    collections: string[]
    trendingCollections: string[]
    productTypes: string[]
    genders: string[]
  }
  onFilterChange: (filterType: string, value: string) => void
  onClearAll: () => void
}

export default function FilterDrawer({
  isOpen,
  onClose,
  isDark,
  source,
  categories,
  collections,
  trendingCollections,
  productTypes,
  genders,
  selectedFilters,
  onFilterChange,
  onClearAll,
}: FilterDrawerProps) {
  // Determine which sections to show based on source
  // Hero Collection: categories, productTypes, genders
  // Trending Collection: categories, productTypes, genders
  // Product Type: categories, collections, trendingCollections, genders
  // Category: collections, trendingCollections, productTypes, genders
  // Recipient (gender): categories, collections, trendingCollections, productTypes
  const shouldShowSection = {
    collections: source !== 'hero-collection' && source !== 'trending-collection',
    trendingCollections: source !== 'hero-collection' && source !== 'trending-collection',
    categories: source !== 'recipient',
    productTypes: source !== 'recipient',
    genders: true, // Always show
  }

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    collections: true,
    trendingCollections: true,
    categories: true,
    productTypes: true,
    genders: true,
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const hasActiveFilters = 
    selectedFilters.categories.length > 0 ||
    selectedFilters.collections.length > 0 ||
    selectedFilters.trendingCollections.length > 0 ||
    selectedFilters.productTypes.length > 0 ||
    selectedFilters.genders.length > 0

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={cn(
        'fixed top-0 right-0 bottom-0 w-80 shadow-2xl z-50 overflow-y-auto transition-transform',
        isDark ? 'bg-zinc-900' : 'bg-white'
      )}>
        {/* Header */}
        <div className={cn(
          'sticky top-0 z-10 flex items-center justify-between p-4 border-b',
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'
        )}>
          <h2 className={cn(
            'text-lg font-bold',
            isDark ? 'text-white' : 'text-black'
          )}>
            Filters
          </h2>
          <button
            onClick={onClose}
            className={cn(
              'p-2 rounded-lg transition-colors',
              isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clear All Button */}
        {hasActiveFilters && (
          <div className="p-4 border-b border-zinc-800">
            <button
              onClick={onClearAll}
              className={cn(
                'w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                isDark 
                  ? 'bg-zinc-800 text-white hover:bg-zinc-700' 
                  : 'bg-gray-100 text-black hover:bg-gray-200'
              )}
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Filter Sections */}
        <div className="p-4 space-y-6">
          {/* Collections Section */}
          {shouldShowSection.collections && collections.length > 0 && (
            <div>
              <button
                onClick={() => toggleSection('collections')}
                className={cn(
                  'w-full flex items-center justify-between mb-3',
                  isDark ? 'text-white' : 'text-black'
                )}
              >
                <h3 className="font-semibold text-sm uppercase tracking-wide">
                  Collections
                </h3>
                {expandedSections.collections ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {expandedSections.collections && (
                <div className="space-y-2">
                  {collections.map((collection) => (
                    <label
                      key={collection}
                      className={cn(
                        'flex items-center gap-2 cursor-pointer p-2 rounded-lg transition-colors',
                        isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-50'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedFilters.collections.includes(collection)}
                        onChange={() => onFilterChange('collections', collection)}
                        className="w-4 h-4 rounded border-gray-300 text-gold-500 focus:ring-gold-500"
                      />
                      <span className={cn(
                        'text-sm',
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      )}>
                        {collection}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Trending Collections Section */}
          {shouldShowSection.trendingCollections && trendingCollections.length > 0 && (
            <div>
              <button
                onClick={() => toggleSection('trendingCollections')}
                className={cn(
                  'w-full flex items-center justify-between mb-3',
                  isDark ? 'text-white' : 'text-black'
                )}
              >
                <h3 className="font-semibold text-sm uppercase tracking-wide">
                  Trending Collections
                </h3>
                {expandedSections.trendingCollections ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {expandedSections.trendingCollections && (
                <div className="space-y-2">
                  {trendingCollections.map((collection) => (
                    <label
                      key={collection}
                      className={cn(
                        'flex items-center gap-2 cursor-pointer p-2 rounded-lg transition-colors',
                        isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-50'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedFilters.trendingCollections.includes(collection)}
                        onChange={() => onFilterChange('trendingCollections', collection)}
                        className="w-4 h-4 rounded border-gray-300 text-gold-500 focus:ring-gold-500"
                      />
                      <span className={cn(
                        'text-sm',
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      )}>
                        {collection}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Categories Section */}
          {shouldShowSection.categories && categories.length > 0 && (
            <div>
              <button
                onClick={() => toggleSection('categories')}
                className={cn(
                  'w-full flex items-center justify-between mb-3',
                  isDark ? 'text-white' : 'text-black'
                )}
              >
                <h3 className="font-semibold text-sm uppercase tracking-wide">
                  Categories
                </h3>
                {expandedSections.categories ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {expandedSections.categories && (
                <div className="space-y-2">
                  {categories.map((category) => (
                    <label
                      key={category}
                      className={cn(
                        'flex items-center gap-2 cursor-pointer p-2 rounded-lg transition-colors',
                        isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-50'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedFilters.categories.includes(category)}
                        onChange={() => onFilterChange('categories', category)}
                        className="w-4 h-4 rounded border-gray-300 text-gold-500 focus:ring-gold-500"
                      />
                      <span className={cn(
                        'text-sm',
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      )}>
                        {category}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Product Types Section */}
          {shouldShowSection.productTypes && productTypes.length > 0 && (
            <div>
              <button
                onClick={() => toggleSection('productTypes')}
                className={cn(
                  'w-full flex items-center justify-between mb-3',
                  isDark ? 'text-white' : 'text-black'
                )}
              >
                <h3 className="font-semibold text-sm uppercase tracking-wide">
                  Product Type
                </h3>
                {expandedSections.productTypes ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {expandedSections.productTypes && (
                <div className="space-y-2">
                  {productTypes.map((type) => (
                    <label
                      key={type}
                      className={cn(
                        'flex items-center gap-2 cursor-pointer p-2 rounded-lg transition-colors',
                        isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-50'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedFilters.productTypes.includes(type)}
                        onChange={() => onFilterChange('productTypes', type)}
                        className="w-4 h-4 rounded border-gray-300 text-gold-500 focus:ring-gold-500"
                      />
                      <span className={cn(
                        'text-sm',
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      )}>
                        {type}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Gender Section */}
          {genders.length > 0 && (
            <div>
              <button
                onClick={() => toggleSection('genders')}
                className={cn(
                  'w-full flex items-center justify-between mb-3',
                  isDark ? 'text-white' : 'text-black'
                )}
              >
                <h3 className="font-semibold text-sm uppercase tracking-wide">
                  Shop For
                </h3>
                {expandedSections.genders ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {expandedSections.genders && (
                <div className="space-y-2">
                  {genders.map((gender) => (
                    <label
                      key={gender}
                      className={cn(
                        'flex items-center gap-2 cursor-pointer p-2 rounded-lg transition-colors',
                        isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-50'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedFilters.genders.includes(gender)}
                        onChange={() => onFilterChange('genders', gender)}
                        className="w-4 h-4 rounded border-gray-300 text-gold-500 focus:ring-gold-500"
                      />
                      <span className={cn(
                        'text-sm',
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      )}>
                        {gender}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
