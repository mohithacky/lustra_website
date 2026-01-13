'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn, getImageUrl, formatPrice } from '@/lib/utils'
import { Heart, Share2, ShoppingCart, ShoppingBag, PhoneCall, ChevronLeft, ChevronRight, MessageSquare, Loader2 } from 'lucide-react'
import { addToCart, addToWishlist, removeFromWishlist, isInWishlist, isInCart } from '@/lib/api'
import { getSupabaseClient } from '@/lib/supabase-client'
import ProductReviews from './ProductReviews'

interface Product {
  id: string
  name: string
  price: string | number | null
  description?: string | null
  image_url: string | null
  images?: string[] | null
  category?: string | null
  collection?: string | string[] | null
  weight?: string | null
  purity?: string | null
  gender?: string | null
  is_bestseller?: boolean | null
  is_trending?: boolean | null
}

interface ProductDetailProps {
  product: Product
  relatedProducts: Product[]
  isDark: boolean
  shopDomain: string
  shopName?: string | null
  phoneNumber?: string | null
  shopId?: string
  onLoginRequired?: () => void
  isDemo?: boolean
}

export default function ProductDetail({
  product,
  relatedProducts,
  isDark,
  shopDomain,
  shopName,
  phoneNumber,
  shopId,
  onLoginRequired,
  isDemo = false,
}: ProductDetailProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [showCallbackModal, setShowCallbackModal] = useState(false)
  const [callbackPhone, setCallbackPhone] = useState('')
  const [callbackMessage, setCallbackMessage] = useState('')
  const [callbackSubmitting, setCallbackSubmitting] = useState(false)
  const [callbackSubmitted, setCallbackSubmitted] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [isCarted, setIsCarted] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false)

  // Get customer from localStorage
  const getCustomer = () => {
    if (typeof window === 'undefined') return null
    const saved = localStorage.getItem('websiteCustomer')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return null
      }
    }
    return null
  }

  // Check wishlist and cart status on mount
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

      // Pre-fill phone from customer data
      if (customer.phone) {
        setCallbackPhone(customer.phone.replace('+91', ''))
      }
    }
    checkStatus()
  }, [shopId, product.id])
  
  // Combine main image with additional images
  const allImages: string[] = []
  if (product.image_url) allImages.push(product.image_url)
  if (product.images && Array.isArray(product.images)) {
    allImages.push(...product.images.filter(img => img && img !== product.image_url))
  }
  if (allImages.length === 0) allImages.push('/placeholder.jpg')

  const currentImage = allImages[selectedImageIndex] || allImages[0]

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))
  }

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))
  }

  const handleBuyNow = async () => {
    const customer = getCustomer()
    if (!customer) {
      if (onLoginRequired) {
        onLoginRequired()
      } else {
        alert('Please login to purchase')
      }
      return
    }
    if (!shopId) {
      console.error('Shop ID not available')
      return
    }

    // Add to cart and redirect to cart
    setIsAddingToCart(true)
    try {
      const success = await addToCart(shopId, customer.id, product.id)
      if (success) {
        window.location.href = `/${shopDomain}/cart`
      } else {
        alert('Failed to add to cart. Please try again.')
      }
    } catch (e) {
      console.error('Error in buy now:', e)
      alert('Failed to process. Please try again.')
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleAddToCart = async () => {
    const customer = getCustomer()
    if (!customer) {
      if (onLoginRequired) {
        onLoginRequired()
      } else {
        alert('Please login to add items to cart')
      }
      return
    }
    if (!shopId) {
      console.error('Shop ID not available')
      return
    }

    console.log('[AddToCart] Starting:', { shopId, customerId: customer.id, productId: product.id })
    setIsAddingToCart(true)
    try {
      const success = await addToCart(shopId, customer.id, product.id)
      console.log('[AddToCart] Result:', success)
      if (success) {
        setIsCarted(true)
        alert('Added to cart!')
      } else {
        console.error('[AddToCart] Failed - API returned false')
        alert('Failed to add to cart. Please try again.')
      }
    } catch (e) {
      console.error('[AddToCart] Error:', e)
      alert('Failed to add to cart. Please try again.')
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleToggleWishlist = async () => {
    const customer = getCustomer()
    if (!customer) {
      if (onLoginRequired) {
        onLoginRequired()
      } else {
        alert('Please login to manage wishlist')
      }
      return
    }
    if (!shopId) {
      console.error('Shop ID not available')
      return
    }

    setIsTogglingWishlist(true)
    try {
      if (isWishlisted) {
        const success = await removeFromWishlist(shopId, customer.id, product.id)
        if (success) {
          setIsWishlisted(false)
        }
      } else {
        const success = await addToWishlist(shopId, customer.id, product.id)
        if (success) {
          setIsWishlisted(true)
        }
      }
    } catch (e) {
      console.error('Error toggling wishlist:', e)
    } finally {
      setIsTogglingWishlist(false)
    }
  }

  const handleRequestCallback = async () => {
    if (!callbackPhone || callbackPhone.length < 10) {
      alert('Please enter a valid phone number')
      return
    }
    if (!shopId) return

    setCallbackSubmitting(true)
    
    try {
      const customer = getCustomer()
      const productImage = product.image_url || (product.images && product.images[0]) || null

      // Get Supabase client
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error('Supabase client not configured')
      }

      // Insert callback request to Supabase (matching Flutter)
      const { error } = await supabase.from('customer_callback_requests').insert({
        product_id: product.id,
        product_name: product.name,
        product_image_url: productImage,
        shop_id: shopId,
        customer_id: customer?.id || null,
        customer_phone: '+91' + callbackPhone,
        message: callbackMessage.trim() || null,
        status: 'pending',
      })

      if (error) {
        console.error('Supabase error (stringified):', JSON.stringify(error, null, 2))
        console.error('Supabase error (raw):', error)
        console.error('Error properties:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      setCallbackSubmitted(true)
      setTimeout(() => {
        setShowCallbackModal(false)
        setCallbackSubmitted(false)
        setCallbackPhone('')
        setCallbackMessage('')
      }, 2000)
    } catch (e: any) {
      console.error('Error submitting callback request (stringified):', JSON.stringify(e, null, 2))
      console.error('Error submitting callback request (raw):', e)
      console.error('Error type:', typeof e)
      console.error('Error keys:', Object.keys(e || {}))
      alert('Failed to submit request. Please try again.')
    } finally {
      setCallbackSubmitting(false)
    }
  }

  return (
    <div className={cn(
      'min-h-screen py-8',
      isDark ? 'bg-[#080808]' : 'bg-offwhite'
    )}>
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link 
                href={`/${shopDomain}`}
                className={cn(
                  'hover:text-gold-500 transition-colors',
                  isDark ? 'text-gray-400' : 'text-gray-500'
                )}
              >
                Home
              </Link>
            </li>
            <li className={isDark ? 'text-gray-600' : 'text-gray-400'}>/</li>
            <li>
              <Link 
                href={`/${shopDomain}/products`}
                className={cn(
                  'hover:text-gold-500 transition-colors',
                  isDark ? 'text-gray-400' : 'text-gray-500'
                )}
              >
                Products
              </Link>
            </li>
            <li className={isDark ? 'text-gray-600' : 'text-gray-400'}>/</li>
            <li className={isDark ? 'text-white' : 'text-black'}>
              {product.name}
            </li>
          </ol>
        </nav>

        {/* Main Content - matches Flutter ProductDetailPage layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left: Product Images */}
          <div>
            {/* Main Image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-white mb-4">
              <Image
                src={getImageUrl(currentImage)}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
              
              {/* Navigation Arrows */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-black" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-black" />
                  </button>
                </>
              )}

              {/* Badges */}
              {(product.is_bestseller || product.is_trending) && (
                <div className="absolute top-4 left-4 flex gap-2">
                  {product.is_bestseller && (
                    <span className="bg-gold-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                      Bestseller
                    </span>
                  )}
                  {product.is_trending && (
                    <span className="bg-black text-white text-xs px-3 py-1 rounded-full font-medium">
                      Trending
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {allImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={cn(
                      'relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors',
                      index === selectedImageIndex
                        ? 'border-gold-500'
                        : 'border-transparent hover:border-gray-300'
                    )}
                  >
                    <Image
                      src={getImageUrl(img)}
                      alt={`${product.name} view ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div>
            <h1 className={cn(
              'font-display text-2xl md:text-3xl font-bold mb-4',
              isDark ? 'text-white' : 'text-black'
            )}>
              {product.name}
            </h1>

            {/* Price */}
            <div className="mb-6">
              <span className={cn(
                'text-2xl md:text-3xl font-bold',
                isDark ? 'text-gold-400' : 'text-gold-600'
              )}>
                {formatPrice(product.price)}
              </span>
            </div>

            {/* Product Details */}
            <div className={cn(
              'space-y-4 mb-8 pb-8 border-b',
              isDark ? 'border-zinc-700' : 'border-gray-200'
            )}>
              {product.category && (
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Category</span>
                  <span className={isDark ? 'text-white' : 'text-black'}>{product.category}</span>
                </div>
              )}
              {product.collection && (
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Collection</span>
                  <span className={isDark ? 'text-white' : 'text-black'}>{product.collection}</span>
                </div>
              )}
              {product.weight && (
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Weight</span>
                  <span className={isDark ? 'text-white' : 'text-black'}>{product.weight}</span>
                </div>
              )}
              {product.purity && (
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Purity</span>
                  <span className={isDark ? 'text-white' : 'text-black'}>{product.purity}</span>
                </div>
              )}
              {product.gender && (
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>For</span>
                  <span className={isDark ? 'text-white' : 'text-black'}>{product.gender}</span>
                </div>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-8">
                <h3 className={cn(
                  'font-semibold mb-2',
                  isDark ? 'text-white' : 'text-black'
                )}>
                  Description
                </h3>
                <p className={cn(
                  'text-sm leading-relaxed',
                  isDark ? 'text-gray-300' : 'text-gray-600'
                )}>
                  {product.description}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Buy Now Button */}
              <button
                onClick={handleBuyNow}
                className="w-full flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-600 text-white py-3.5 rounded-xl font-semibold transition-colors"
              >
                <ShoppingBag className="w-5 h-5" />
                Buy Now
              </button>
              
              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold transition-colors border-2',
                  isDark 
                    ? 'border-gold-500 text-gold-400 hover:bg-gold-500/10' 
                    : 'border-gold-500 text-gold-600 hover:bg-gold-50'
                )}
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </button>

              {/* Request a Callback Button */}
              <button
                onClick={() => setShowCallbackModal(true)}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold transition-colors border',
                  isDark 
                    ? 'border-zinc-700 text-white hover:bg-zinc-800' 
                    : 'border-gray-300 text-black hover:bg-gray-50'
                )}
              >
                <PhoneCall className="w-5 h-5" />
                Request a Callback
              </button>

              {/* Wishlist and Share */}
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={handleToggleWishlist}
                  disabled={isTogglingWishlist}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-colors border',
                    isWishlisted
                      ? 'border-red-500 text-red-500 bg-red-50 dark:bg-red-500/10'
                      : isDark 
                        ? 'border-zinc-700 text-white hover:bg-zinc-800' 
                        : 'border-gray-300 text-black hover:bg-gray-50'
                  )}
                >
                  {isTogglingWishlist ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Heart className={cn('w-5 h-5', isWishlisted && 'fill-current')} />
                  )}
                  {isWishlisted ? 'Wishlisted' : 'Wishlist'}
                </button>
                <button className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-colors border',
                  isDark 
                    ? 'border-zinc-700 text-white hover:bg-zinc-800' 
                    : 'border-gray-300 text-black hover:bg-gray-50'
                )}>
                  <Share2 className="w-5 h-5" />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className={cn(
              'font-display text-xl font-bold mb-6',
              isDark ? 'text-white' : 'text-black'
            )}>
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((relProduct) => (
                <Link
                  key={relProduct.id}
                  href={`/products/${relProduct.id}`}
                  className="block"
                >
                  <div className="rounded-xl overflow-hidden bg-white shadow-md hover:shadow-xl transition-shadow">
                    <div className="relative aspect-square">
                      <Image
                        src={getImageUrl(relProduct.image_url)}
                        alt={relProduct.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm text-black line-clamp-1 mb-1">
                        {relProduct.name}
                      </h3>
                      <p className="font-bold text-black">
                        {formatPrice(relProduct.price)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Product Reviews Section */}
        {shopId && (
          <ProductReviews
            productId={product.id}
            shopId={shopId}
            isDark={isDark}
          />
        )}
      </div>

      {/* Request Callback Modal */}
      {showCallbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowCallbackModal(false)}
          />
          <div className={cn(
            'relative w-full max-w-md mx-4 rounded-2xl p-6',
            isDark ? 'bg-zinc-900' : 'bg-white'
          )}>
            <h3 className={cn(
              'font-display text-xl font-bold mb-4',
              isDark ? 'text-white' : 'text-black'
            )}>
              Request a Callback
            </h3>
            {callbackSubmitted ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <PhoneCall className="w-6 h-6 text-green-600" />
                </div>
                <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                  Callback request submitted! We&apos;ll contact you soon.
                </p>
              </div>
            ) : (
              <>
                <p className={cn('text-sm mb-4', isDark ? 'text-gray-400' : 'text-gray-500')}>
                  We&apos;ll call you back about this product.
                </p>
                <div className="space-y-3">
                  <div className="relative">
                    <PhoneCall className={cn(
                      'absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5',
                      isDark ? 'text-gray-500' : 'text-gray-400'
                    )} />
                    <input
                      type="tel"
                      value={callbackPhone}
                      onChange={(e) => setCallbackPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="Phone Number"
                      className={cn(
                        'w-full pl-11 pr-4 py-3 rounded-xl border outline-none focus:border-gold-500',
                        isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-gray-50 border-gray-300 text-black'
                      )}
                    />
                  </div>
                  <div className="relative">
                    <MessageSquare className={cn(
                      'absolute left-3 top-3 w-5 h-5',
                      isDark ? 'text-gray-500' : 'text-gray-400'
                    )} />
                    <textarea
                      value={callbackMessage}
                      onChange={(e) => setCallbackMessage(e.target.value)}
                      placeholder="Message (Optional)"
                      rows={3}
                      className={cn(
                        'w-full pl-11 pr-4 py-3 rounded-xl border outline-none focus:border-gold-500 resize-none',
                        isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-gray-50 border-gray-300 text-black'
                      )}
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setShowCallbackModal(false)}
                    disabled={callbackSubmitting}
                    className={cn(
                      'flex-1 py-3 rounded-xl font-semibold border',
                      isDark ? 'border-zinc-700 text-white' : 'border-gray-300 text-black'
                    )}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRequestCallback}
                    disabled={callbackSubmitting}
                    className="flex-1 py-3 rounded-xl font-semibold bg-gold-500 text-white hover:bg-gold-600 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {callbackSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Request'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
 