/**
 * API service for backend communication
 * Updated to use session-based authentication with HTTP-only cookies
 */

const BACKEND_URL = 'https://api-5sqqk2n6ra-uc.a.run.app'

// ============================================================================
// AUTH API - Firebase phone authentication (still uses external backend)
// ============================================================================

export interface CustomerData {
  id: string
  firebase_uid: string
  phone_number: string
  name?: string
  email?: string
}

/**
 * Check if phone number exists for a shop
 */
export async function checkPhoneExists(phoneNumber: string, userId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${BACKEND_URL}/auth/check-phone/${userId}/${encodeURIComponent(phoneNumber)}`,
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
export async function sendOtp(phoneNumber: string, userId: string): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, shopId: userId }),
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
  userId: string,
  name?: string
): Promise<CustomerData> {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber,
        code,
        shopId: userId,
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
// SESSION API - Check authentication status
// ============================================================================

export interface SessionInfo {
  authenticated: boolean
  customerId?: string
  firebaseUid?: string
  tenantSubdomain?: string
}

/**
 * Check if user is authenticated
 * Session cookie is sent automatically
 */
export async function checkSession(): Promise<SessionInfo> {
  try {
    const response = await fetch('/api/auth/session')
    
    if (response.ok) {
      const data = await response.json()
      return data
    }
    
    return { authenticated: false }
  } catch (e) {
    console.error('[API checkSession] Error:', e)
    return { authenticated: false }
  }
}

/**
 * Logout - clear session
 */
export async function logout(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/session', { method: 'DELETE' })
    return response.ok
  } catch (e) {
    console.error('[API logout] Error:', e)
    return false
  }
}

// ============================================================================
// CART API - Session-based authentication
// ============================================================================

export interface CartItem {
  id: string
  product_id: string
  quantity: number
  selected_variant?: Record<string, unknown>
  product?: {
    id: string
    name: string
    price: number
    image_url?: string
    images?: string[]
  }
}

/**
 * Get cart items for authenticated customer
 * Session cookie is sent automatically
 */
export async function getCart(): Promise<CartItem[]> {
  try {
    const response = await fetch('/api/cart')

    if (response.ok) {
      const data = await response.json()
      if (data.success && data.items) {
        return data.items
      }
    }
    return []
  } catch (e) {
    console.error('[API getCart] Error:', e)
    return []
  }
}

/**
 * Add item to cart for authenticated customer
 */
export async function addToCart(
  productId: string,
  quantity: number = 1,
  selectedVariant?: Record<string, unknown>
): Promise<boolean> {
  try {
    console.log('[API addToCart] Request:', { productId, quantity })
    
    const response = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        quantity,
        selectedVariant,
      }),
    })

    const data = await response.json()
    console.log('[API addToCart] Response:', { status: response.status, data })
    
    return data.success === true
  } catch (e) {
    console.error('[API addToCart] Exception:', e)
    return false
  }
}

/**
 * Update cart item quantity for authenticated customer
 */
export async function updateCartQuantity(
  itemId: string,
  quantity: number
): Promise<boolean> {
  try {
    const response = await fetch('/api/cart', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, quantity }),
    })

    const data = await response.json()
    return data.success === true
  } catch (e) {
    console.error('[API updateCartQuantity] Error:', e)
    return false
  }
}

/**
 * Remove item from cart for authenticated customer
 */
export async function removeFromCart(itemId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `/api/cart?itemId=${itemId}`,
      { method: 'DELETE' }
    )

    const data = await response.json()
    return data.success === true
  } catch (e) {
    console.error('[API removeFromCart] Error:', e)
    return false
  }
}

/**
 * Clear entire cart for authenticated customer
 */
export async function clearCart(): Promise<boolean> {
  try {
    const response = await fetch('/api/cart', { method: 'DELETE' })

    const data = await response.json()
    return data.success === true
  } catch (e) {
    console.error('[API clearCart] Error:', e)
    return false
  }
}

/**
 * Check if product is in cart
 */
export async function isInCart(productId: string): Promise<boolean> {
  try {
    const items = await getCart()
    return items.some((item) => item.product_id === productId)
  } catch (e) {
    console.error('[API isInCart] Error:', e)
    return false
  }
}

// ============================================================================
// WISHLIST API - Session-based authentication
// ============================================================================

export interface WishlistItem {
  id: string
  product_id: string
  product?: {
    id: string
    name: string
    price: number
    image_url?: string
    images?: string[]
  }
  created_at: string
}

/**
 * Get wishlist items for authenticated customer
 */
export async function getWishlist(): Promise<WishlistItem[]> {
  try {
    const response = await fetch('/api/wishlist')

    if (response.ok) {
      const data = await response.json()
      if (data.success && data.items) {
        return data.items
      }
    }
    return []
  } catch (e) {
    console.error('[API getWishlist] Error:', e)
    return []
  }
}

/**
 * Add item to wishlist for authenticated customer
 */
export async function addToWishlist(productId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    })

    const data = await response.json()
    return data.success === true
  } catch (e) {
    console.error('[API addToWishlist] Error:', e)
    return false
  }
}

/**
 * Remove item from wishlist for authenticated customer
 */
export async function removeFromWishlist(productId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `/api/wishlist?productId=${productId}`,
      { method: 'DELETE' }
    )

    const data = await response.json()
    return data.success === true
  } catch (e) {
    console.error('[API removeFromWishlist] Error:', e)
    return false
  }
}

/**
 * Check if product is in wishlist
 */
export async function isInWishlist(productId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/wishlist?productId=${productId}`)

    if (response.ok) {
      const data = await response.json()
      return data.inWishlist === true
    }
    return false
  } catch (e) {
    console.error('[API isInWishlist] Error:', e)
    return false
  }
}

/**
 * Toggle wishlist (add if not in wishlist, remove if in wishlist)
 */
export async function toggleWishlist(productId: string): Promise<boolean> {
  const inWishlist = await isInWishlist(productId)
  if (inWishlist) {
    return await removeFromWishlist(productId)
  } else {
    return await addToWishlist(productId)
  }
}

// ============================================================================
// ORDERS API - Still uses Firebase backend (to be migrated later)
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
