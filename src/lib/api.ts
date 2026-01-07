/**
 * API service for backend communication
 * Uses the same Firebase Cloud Functions backend as the Flutter app
 */

const BACKEND_URL = 'https://api-5sqqk2n6ra-uc.a.run.app'

// ============================================================================
// AUTH API - Twilio-based phone authentication
// ============================================================================

export interface CustomerData {
  id: string
  twilio_uid: string
  phone_number: string
  name?: string
  email?: string
}

/**
 * Check if phone number exists for a shop
 */
export async function checkPhoneExists(phoneNumber: string, shopId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${BACKEND_URL}/auth/check-phone/${shopId}/${encodeURIComponent(phoneNumber)}`,
      { headers: { 'Content-Type': 'application/json' } }
    )

    if (response.ok) {
      const data = await response.json()
      return data.exists === true
    }
    return false
  } catch (e) {
    console.error('Error checking phone existence:', e)
    return false
  }
}

/**
 * Send OTP to phone number
 */
export async function sendOtp(phoneNumber: string, shopId: string): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, shopId }),
    })

    if (response.ok) {
      const data = await response.json()
      return data.success === true
    } else {
      const error = await response.json()
      throw new Error(error.error || 'Failed to send OTP')
    }
  } catch (e) {
    console.error('Error sending OTP:', e)
    throw e
  }
}

/**
 * Verify OTP and create/get customer
 */
export async function verifyOtp(
  phoneNumber: string,
  code: string,
  shopId: string,
  name?: string
): Promise<CustomerData> {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber,
        code,
        shopId,
        ...(name && { name }),
      }),
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success && data.customer) {
        return data.customer as CustomerData
      }
      throw new Error('Invalid response from server')
    } else {
      const error = await response.json()
      throw new Error(error.error || 'Failed to verify OTP')
    }
  } catch (e) {
    console.error('Error verifying OTP:', e)
    throw e
  }
}

// ============================================================================
// CART API
// ============================================================================

export interface CartItem {
  id: string
  product_id: string
  quantity: number
  selected_variant?: Record<string, unknown>
  product?: {
    name: string
    price: number
    image_url?: string
  }
}

/**
 * Get cart items for a customer
 */
export async function getCart(shopId: string, customerId: string): Promise<CartItem[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/cart/${shopId}/${customerId}`)

    if (response.ok) {
      const data = await response.json()
      if (data.success && data.items) {
        return data.items
      }
    }
    return []
  } catch (e) {
    console.error('Error fetching cart:', e)
    return []
  }
}

/**
 * Add item to cart
 */
export async function addToCart(
  shopId: string,
  customerId: string,
  productId: string,
  quantity: number = 1,
  selectedVariant?: Record<string, unknown>
): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/cart/${shopId}/${customerId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        quantity,
        ...(selectedVariant && { selectedVariant }),
      }),
    })

    return response.ok
  } catch (e) {
    console.error('Error adding to cart:', e)
    return false
  }
}

/**
 * Update cart item quantity
 */
export async function updateCartQuantity(
  shopId: string,
  customerId: string,
  itemId: string,
  quantity: number
): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/cart/${shopId}/${customerId}/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    })

    return response.ok
  } catch (e) {
    console.error('Error updating cart:', e)
    return false
  }
}

/**
 * Remove item from cart
 */
export async function removeFromCart(
  shopId: string,
  customerId: string,
  itemId: string
): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/cart/${shopId}/${customerId}/${itemId}`, {
      method: 'DELETE',
    })

    return response.ok
  } catch (e) {
    console.error('Error removing from cart:', e)
    return false
  }
}

/**
 * Clear entire cart
 */
export async function clearCart(shopId: string, customerId: string): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/cart/${shopId}/${customerId}`, {
      method: 'DELETE',
    })

    return response.ok
  } catch (e) {
    console.error('Error clearing cart:', e)
    return false
  }
}

/**
 * Check if product is in cart
 */
export async function isInCart(
  shopId: string,
  customerId: string,
  productId: string
): Promise<boolean> {
  try {
    const items = await getCart(shopId, customerId)
    return items.some((item) => item.product_id === productId)
  } catch (e) {
    console.error('Error checking if product is in cart:', e)
    return false
  }
}

// ============================================================================
// WISHLIST API
// ============================================================================

export interface WishlistItem {
  id: string
  product_id: string
  product?: {
    name: string
    price: number
    image_url?: string
  }
  created_at: string
}

/**
 * Get wishlist items for a customer
 */
export async function getWishlist(shopId: string, customerId: string): Promise<WishlistItem[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/wishlist/${shopId}/${customerId}`)

    if (response.ok) {
      const data = await response.json()
      if (data.success && data.items) {
        return data.items
      }
    }
    return []
  } catch (e) {
    console.error('Error fetching wishlist:', e)
    return []
  }
}

/**
 * Add item to wishlist
 */
export async function addToWishlist(
  shopId: string,
  customerId: string,
  productId: string
): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/wishlist/${shopId}/${customerId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    })

    return response.ok
  } catch (e) {
    console.error('Error adding to wishlist:', e)
    return false
  }
}

/**
 * Remove item from wishlist
 */
export async function removeFromWishlist(
  shopId: string,
  customerId: string,
  productId: string
): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/wishlist/${shopId}/${customerId}/${productId}`, {
      method: 'DELETE',
    })

    return response.ok
  } catch (e) {
    console.error('Error removing from wishlist:', e)
    return false
  }
}

/**
 * Check if product is in wishlist
 */
export async function isInWishlist(
  shopId: string,
  customerId: string,
  productId: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `${BACKEND_URL}/wishlist/${shopId}/${customerId}/check/${productId}`
    )

    if (response.ok) {
      const data = await response.json()
      return data.inWishlist === true
    }
    return false
  } catch (e) {
    console.error('Error checking wishlist:', e)
    return false
  }
}

/**
 * Toggle wishlist (add if not in wishlist, remove if in wishlist)
 */
export async function toggleWishlist(
  shopId: string,
  customerId: string,
  productId: string
): Promise<boolean> {
  const inWishlist = await isInWishlist(shopId, customerId, productId)
  if (inWishlist) {
    return await removeFromWishlist(shopId, customerId, productId)
  } else {
    return await addToWishlist(shopId, customerId, productId)
  }
}

// ============================================================================
// ORDERS API
// ============================================================================

export interface OrderItem {
  product_id: string
  name: string
  price: number
  quantity: number
  image_url?: string
  selected_variant?: Record<string, unknown>
}

export interface CustomerOrder {
  id: string
  order_number: string
  status: string
  items: OrderItem[]
  subtotal: number
  discount: number
  shipping_cost: number
  tax: number
  total: number
  shipping_address?: Record<string, unknown>
  payment_method?: string
  payment_status: string
  customer_notes?: string
  created_at: string
}

/**
 * Get orders for a customer
 */
export async function getOrders(shopId: string, customerId: string): Promise<CustomerOrder[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/orders/${shopId}/${customerId}`)

    if (response.ok) {
      const data = await response.json()
      if (data.success && data.orders) {
        return data.orders
      }
    }
    return []
  } catch (e) {
    console.error('Error fetching orders:', e)
    return []
  }
}

/**
 * Create order
 */
export async function createOrder(
  shopId: string,
  customerId: string,
  items: OrderItem[],
  shippingAddress?: Record<string, unknown>,
  paymentMethod?: string,
  customerNotes?: string
): Promise<CustomerOrder | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/orders/${shopId}/${customerId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items,
        ...(shippingAddress && { shippingAddress }),
        ...(paymentMethod && { paymentMethod }),
        ...(customerNotes && { customerNotes }),
      }),
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success && data.order) {
        return data.order
      }
    }
    return null
  } catch (e) {
    console.error('Error creating order:', e)
    return null
  }
}
