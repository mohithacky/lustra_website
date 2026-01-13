'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn, getImageUrl, formatPrice } from '@/lib/utils'
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, Loader2 } from 'lucide-react'
import { getCart, updateCartQuantity, removeFromCart, clearCart, CartItem } from '@/lib/api'

interface CartContentProps {
  shopId: string
  shopDomain: string
  isDark: boolean
}

export default function CartContent({ shopId, shopDomain, isDark }: CartContentProps) {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())
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
    const loadCart = async () => {
      if (!customer) return
      
      setIsLoading(true)
      const items = await getCart(customer.shopId, customer.id)
      setCartItems(items)
      setIsLoading(false)
    }
    
    if (customer) {
      loadCart()
    }
  }, [customer])

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (!customer || newQuantity < 1) return
    
    setUpdatingItems(prev => new Set(prev).add(itemId))
    const success = await updateCartQuantity(customer.shopId, customer.id, itemId, newQuantity)
    
    if (success) {
      setCartItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ))
    }
    setUpdatingItems(prev => {
      const next = new Set(prev)
      next.delete(itemId)
      return next
    })
  }

  const handleRemoveItem = async (itemId: string) => {
    if (!customer) return
    
    setUpdatingItems(prev => new Set(prev).add(itemId))
    const success = await removeFromCart(customer.shopId, customer.id, itemId)
    
    if (success) {
      setCartItems(prev => prev.filter(item => item.id !== itemId))
    }
    setUpdatingItems(prev => {
      const next = new Set(prev)
      next.delete(itemId)
      return next
    })
  }

  const handleClearCart = async () => {
    if (!customer || !confirm('Are you sure you want to clear your cart?')) return
    
    setIsLoading(true)
    const success = await clearCart(customer.shopId, customer.id)
    if (success) {
      setCartItems([])
    }
    setIsLoading(false)
  }

  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.product?.price || 0
    return sum + (price * item.quantity)
  }, 0)

  if (!customer) {
    return (
      <div className={cn(
        'min-h-screen py-16 px-6',
        isDark ? 'bg-[#080808]' : 'bg-offwhite'
      )}>
        <div className="max-w-4xl mx-auto text-center">
          <ShoppingBag className={cn('w-16 h-16 mx-auto mb-4', isDark ? 'text-gray-600' : 'text-gray-400')} />
          <h1 className={cn('font-display text-2xl font-bold mb-4', isDark ? 'text-white' : 'text-black')}>
            Please login to view your cart
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
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className={cn('p-2 rounded-full', isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-100')}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className={cn('font-display text-2xl font-bold', isDark ? 'text-white' : 'text-black')}>
              Shopping Cart
            </h1>
          </div>
          {cartItems.length > 0 && (
            <button
              onClick={handleClearCart}
              className="text-red-500 text-sm font-medium hover:underline"
            >
              Clear Cart
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
          </div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className={cn('w-16 h-16 mx-auto mb-4', isDark ? 'text-gray-600' : 'text-gray-400')} />
            <h2 className={cn('text-xl font-semibold mb-2', isDark ? 'text-white' : 'text-black')}>
              Your cart is empty
            </h2>
            <p className={cn('mb-6', isDark ? 'text-gray-400' : 'text-gray-500')}>
              Add some items to get started
            </p>
            <Link 
              href={`/${shopDomain}/products`}
              className="inline-block bg-gold-500 hover:bg-gold-600 text-white px-6 py-3 rounded-full font-semibold"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'flex gap-4 p-4 rounded-xl',
                    isDark ? 'bg-zinc-900' : 'bg-white shadow-sm'
                  )}
                >
                  {/* Product Image */}
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={getImageUrl(item.product?.image_url)}
                      alt={item.product?.name || 'Product'}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      'font-semibold mb-1 line-clamp-1',
                      isDark ? 'text-white' : 'text-black'
                    )}>
                      {item.product?.name || 'Unknown Product'}
                    </h3>
                    <p className={cn(
                      'text-lg font-bold',
                      isDark ? 'text-gold-400' : 'text-gold-600'
                    )}>
                      {formatPrice(item.product?.price)}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3 mt-3">
                      <div className={cn(
                        'flex items-center rounded-lg border',
                        isDark ? 'border-zinc-700' : 'border-gray-200'
                      )}>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          disabled={updatingItems.has(item.id) || item.quantity <= 1}
                          className={cn(
                            'p-2 disabled:opacity-50',
                            isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'
                          )}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className={cn('px-4 py-1 min-w-[40px] text-center', isDark ? 'text-white' : 'text-black')}>
                          {updatingItems.has(item.id) ? (
                            <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                          ) : (
                            item.quantity
                          )}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          disabled={updatingItems.has(item.id)}
                          className={cn(
                            'p-2 disabled:opacity-50',
                            isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'
                          )}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={updatingItems.has(item.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className={cn(
              'p-6 rounded-xl h-fit',
              isDark ? 'bg-zinc-900' : 'bg-white shadow-sm'
            )}>
              <h2 className={cn('font-display text-lg font-bold mb-4', isDark ? 'text-white' : 'text-black')}>
                Order Summary
              </h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Subtotal</span>
                  <span className={isDark ? 'text-white' : 'text-black'}>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Shipping</span>
                  <span className={isDark ? 'text-white' : 'text-black'}>Calculated at checkout</span>
                </div>
                <div className={cn('border-t pt-3', isDark ? 'border-zinc-700' : 'border-gray-200')}>
                  <div className="flex justify-between">
                    <span className={cn('font-semibold', isDark ? 'text-white' : 'text-black')}>Total</span>
                    <span className={cn('font-bold text-lg', isDark ? 'text-gold-400' : 'text-gold-600')}>
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                </div>
              </div>

              <button className="w-full bg-gold-500 hover:bg-gold-600 text-white py-3 rounded-xl font-semibold">
                Proceed to Checkout
              </button>

              <Link 
                href={`/${shopDomain}/products`}
                className={cn(
                  'block text-center mt-3 py-3 rounded-xl font-semibold border',
                  isDark ? 'border-zinc-700 text-white hover:bg-zinc-800' : 'border-gray-300 text-black hover:bg-gray-50'
                )}
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
 