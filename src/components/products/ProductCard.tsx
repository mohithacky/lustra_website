'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn, getImageUrl, formatPrice } from '@/lib/utils'
import { Heart, ShoppingCart } from 'lucide-react'
import { addToWishlist, removeFromWishlist, isInWishlist, isInCart } from '@/lib/api'

interface Product {
  id: string
  name: string
  price: string | number | null
  image_url?: string | null
  images?: string[] | null
  category?: string | null
  collection?: string | string[] | null
  weight?: string | null
  is_bestseller?: boolean | null
  is_trending?: boolean | null
}

interface ProductCardProps {
  product: Product
  isDark: boolean
  shopDomain: string
  viewMode?: 'grid' | 'list'
  shopId?: string
  isDemo?: boolean
}

function getCustomer() {
  if (typeof window === 'undefined') return null
  const saved = localStorage.getItem('websiteCustomer')
  if (!saved) return null
  try {
    return JSON.parse(saved)
  } catch {
    return null
  }
}

export default function ProductCard({ product, isDark, shopDomain, viewMode = 'grid', shopId, isDemo = false }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [isCarted, setIsCarted] = useState(false)
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false)

  useEffect(() => {
    const checkStatus = async () => {
      const customer = getCustomer()
      if (!customer || !shopId) return

      const [wishlisted, carted] = await Promise.all([
        isInWishlist(shopId, customer.id, product.id),
        isInCart(shopId, customer.id, product.id)
      ])
      setIsWishlisted(wishlisted)
      setIsCarted(carted)
    }
    checkStatus()
  }, [shopId, product.id])

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const customer = getCustomer()
    if (!customer || !shopId) {
      alert('Please login to manage wishlist')
      return
    }

    setIsTogglingWishlist(true)
    try {
      if (isWishlisted) {
        const success = await removeFromWishlist(shopId, customer.id, product.id)
        if (success) setIsWishlisted(false)
      } else {
        const success = await addToWishlist(shopId, customer.id, product.id)
        if (success) setIsWishlisted(true)
      }
    } catch (e) {
      console.error('Error toggling wishlist:', e)
    } finally {
      setIsTogglingWishlist(false)
    }
  }

  if (viewMode === 'list') {
    return (
      <Link
        href={`/products/${product.id}`}
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
          {/* Wishlist Button */}
          <button
            onClick={handleToggleWishlist}
            disabled={isTogglingWishlist}
            className={cn(
              'absolute top-1 right-1 p-1.5 rounded-full transition-colors',
              isWishlisted
                ? 'bg-red-500 text-white'
                : isDark
                ? 'bg-black/50 text-white hover:bg-black/70'
                : 'bg-white/90 text-gray-700 hover:bg-white'
            )}
          >
            <Heart className={cn('w-3.5 h-3.5', isWishlisted && 'fill-current')} />
          </button>
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
      href={`/products/${product.id}`}
      className="block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className={cn(
          'rounded-xl overflow-hidden transition-all duration-300',
          isDark ? 'bg-zinc-900' : 'bg-white shadow-md',
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
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {isDemo && (
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                Demo
              </span>
            )}
            {product.is_bestseller && !isDemo && (
              <span className="bg-gold-500 text-white text-xs px-2 py-1 rounded-full">
                Bestseller
              </span>
            )}
          </div>

          {/* Wishlist Button - Top Right */}
          <button
            onClick={handleToggleWishlist}
            disabled={isTogglingWishlist}
            className={cn(
              'absolute top-2 right-2 p-2 rounded-full transition-all',
              isWishlisted
                ? 'bg-red-500 text-white'
                : isDark
                ? 'bg-black/50 text-white hover:bg-black/70'
                : 'bg-white/90 text-gray-700 hover:bg-white'
            )}
          >
            <Heart className={cn('w-4 h-4', isWishlisted && 'fill-current')} />
          </button>
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className={cn(
            'font-semibold text-sm line-clamp-1 mb-1',
            isDark ? 'text-white' : 'text-black'
          )}>
            {product.name}
          </h3>
          <p className={cn(
            'font-bold mb-2',
            isDark ? 'text-gold-400' : 'text-gold-600'
          )}>
            {formatPrice(product.price)}
          </p>
          
          {/* Add to Cart Button */}
          {isCarted ? (
            <div className={cn(
              'text-xs font-medium text-center py-2 rounded-lg',
              isDark ? 'bg-zinc-800 text-gray-400' : 'bg-gray-100 text-gray-600'
            )}>
              <ShoppingCart className="w-3.5 h-3.5 inline mr-1" />
              Added to Cart
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  )
}
 