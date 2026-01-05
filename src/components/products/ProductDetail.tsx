'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn, getImageUrl, formatPrice } from '@/lib/utils'
import { Heart, Share2, Phone, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react'

interface Product {
  id: string
  name: string
  price: string | number | null
  description?: string | null
  image_url: string | null
  images?: string[] | null
  category?: string | null
  collection?: string | null
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
}

export default function ProductDetail({
  product,
  relatedProducts,
  isDark,
  shopDomain,
  shopName,
  phoneNumber,
}: ProductDetailProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  
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

  const handleWhatsApp = () => {
    if (!phoneNumber) return
    const message = `Hi, I'm interested in ${product.name} from ${shopName || 'your store'}`
    window.open(`https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const handleCall = () => {
    if (!phoneNumber) return
    window.open(`tel:${phoneNumber}`, '_self')
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
              {phoneNumber && (
                <>
                  <button
                    onClick={handleWhatsApp}
                    className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp
                  </button>
                  <button
                    onClick={handleCall}
                    className="w-full flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-600 text-white py-3 rounded-xl font-semibold transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                    Call Now
                  </button>
                </>
              )}
              <div className="flex gap-3">
                <button className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-colors border',
                  isDark 
                    ? 'border-zinc-700 text-white hover:bg-zinc-800' 
                    : 'border-gray-300 text-black hover:bg-gray-50'
                )}>
                  <Heart className="w-5 h-5" />
                  Wishlist
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
                  href={`/${shopDomain}/products/${relProduct.id}`}
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
      </div>
    </div>
  )
}
