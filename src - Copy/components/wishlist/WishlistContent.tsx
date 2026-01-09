'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn, getImageUrl, formatPrice } from '@/lib/utils'
import { Heart, Trash2, ShoppingCart, ArrowLeft, Loader2 } from 'lucide-react'
import { getWishlist, removeFromWishlist, addToCart, WishlistItem } from '@/lib/api'

interface WishlistContentProps {
  shopId: string
  shopDomain: string
  isDark: boolean
}

export default function WishlistContent({ shopId, shopDomain, isDark }: WishlistContentProps) {
  const router = useRouter()
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingItems, setProcessingItems] = useState<Set<string>>(new Set())
  const [customer, setCustomer] = useState<{ id: string; shopId: string } | null>(null)

  useEffect(() => {
    // Load customer from localStorage
    const savedCustomer = localStorage.getItem('websiteCustomer')
    if (savedCustomer) {
      try {
        const parsed = JSON.parse(savedCustomer)
        setCustomer(parsed)
      } catch {
        setIsLoading(false)
      }
    } else {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const loadWishlist = async () => {
      if (!customer) return
      
      setIsLoading(true)
      const items = await getWishlist(customer.shopId, customer.id)
      setWishlistItems(items)
      setIsLoading(false)
    }
    
    if (customer) {
      loadWishlist()
    }
  }, [customer])

  const handleRemoveFromWishlist = async (productId: string) => {
    if (!customer) return
    
    setProcessingItems(prev => new Set(prev).add(productId))
    const success = await removeFromWishlist(customer.shopId, customer.id, productId)
    
    if (success) {
      setWishlistItems(prev => prev.filter(item => item.product_id !== productId))
    }
    setProcessingItems(prev => {
      const next = new Set(prev)
      next.delete(productId)
      return next
    })
  }

  const handleAddToCart = async (productId: string) => {
    if (!customer) return
    
    setProcessingItems(prev => new Set(prev).add(productId))
    const success = await addToCart(customer.shopId, customer.id, productId)
    
    if (success) {
      alert('Added to cart!')
      // Optionally remove from wishlist after adding to cart
      await removeFromWishlist(customer.shopId, customer.id, productId)
      setWishlistItems(prev => prev.filter(item => item.product_id !== productId))
    }
    setProcessingItems(prev => {
      const next = new Set(prev)
      next.delete(productId)
      return next
    })
  }

  if (!customer) {
    return (
      <div className={cn(
        'min-h-screen py-16 px-6',
        isDark ? 'bg-[#080808]' : 'bg-offwhite'
      )}>
        <div className="max-w-4xl mx-auto text-center">
          <Heart className={cn('w-16 h-16 mx-auto mb-4', isDark ? 'text-gray-600' : 'text-gray-400')} />
          <h1 className={cn('font-display text-2xl font-bold mb-4', isDark ? 'text-white' : 'text-black')}>
            Please login to view your wishlist
          </h1>
          <Link 
            href={`/${shopDomain}`}
            className="inline-block bg-gold-500 hover:bg-gold-600 text-white px-6 py-3 rounded-full font-semibold"
          >
            Go to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'min-h-screen py-8',
      isDark ? 'bg-[#080808]' : 'bg-offwhite'
    )}>
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => router.back()}
            className={cn('p-2 rounded-full', isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-100')}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className={cn('font-display text-2xl font-bold', isDark ? 'text-white' : 'text-black')}>
            My Wishlist
          </h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="text-center py-16">
            <Heart className={cn('w-16 h-16 mx-auto mb-4', isDark ? 'text-gray-600' : 'text-gray-400')} />
            <h2 className={cn('text-xl font-semibold mb-2', isDark ? 'text-white' : 'text-black')}>
              Your wishlist is empty
            </h2>
            <p className={cn('mb-6', isDark ? 'text-gray-400' : 'text-gray-500')}>
              Save items you love to your wishlist
            </p>
            <Link 
              href={`/${shopDomain}/products`}
              className="inline-block bg-gold-500 hover:bg-gold-600 text-white px-6 py-3 rounded-full font-semibold"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'rounded-xl overflow-hidden',
                  isDark ? 'bg-zinc-900' : 'bg-white shadow-sm'
                )}
              >
                {/* Product Image */}
                <div className="relative aspect-square">
                  <Image
                    src={getImageUrl(item.product?.image_url)}
                    alt={item.product?.name || 'Product'}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className={cn(
                    'font-semibold mb-2 line-clamp-2',
                    isDark ? 'text-white' : 'text-black'
                  )}>
                    {item.product?.name || 'Unknown Product'}
                  </h3>
                  <p className={cn(
                    'text-lg font-bold mb-4',
                    isDark ? 'text-gold-400' : 'text-gold-600'
                  )}>
                    {formatPrice(item.product?.price)}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddToCart(item.product_id)}
                      disabled={processingItems.has(item.product_id)}
                      className="flex-1 flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-600 text-white py-2.5 rounded-lg font-semibold disabled:opacity-50"
                    >
                      {processingItems.has(item.product_id) ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4" />
                          Add to Cart
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleRemoveFromWishlist(item.product_id)}
                      disabled={processingItems.has(item.product_id)}
                      className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
