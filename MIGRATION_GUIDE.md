# Session-Based Authentication Migration Guide

## ✅ Completed Backend Changes

### 1. Session Management
- Created `src/lib/auth-helpers.ts` - Session verification utilities
- Updated `src/app/api/auth/session/route.ts` - Session CRUD operations
- Sessions stored in `customer_sessions` table with HTTP-only cookies

### 2. API Routes Updated
All API routes now use session authentication:
- ✅ `src/app/api/cart/route.ts` - GET, POST, PUT, DELETE
- ✅ `src/app/api/wishlist/route.ts` - GET, POST, DELETE
- ✅ `src/app/api/reviews/route.ts` - POST (GET is public)
- ✅ `src/app/api/reviews/check/route.ts` - GET
- ✅ `src/app/api/callback-requests/route.ts` - GET, POST

### 3. Frontend API Library
- ✅ Updated `src/lib/api.ts` with new function signatures
- Removed `userId` and `customerId` parameters
- Session cookie sent automatically by browser

## 🔄 Frontend Components That Need Updates

### Critical Updates Required

#### 1. ProductDetail Component
**File**: `src/components/products/ProductDetail.tsx`

**Current calls that need updating:**
```typescript
// OLD - Remove these parameters
await isInWishlist(shopId, customer.id, product.id)
await isInCart(shopId, customer.id, product.id)
await addToCart(shopId, customer.id, product.id)
await addToWishlist(shopId, customer.id, product.id)
await removeFromWishlist(shopId, customer.id, product.id)

// NEW - Session-based
await isInWishlist(product.id)
await isInCart(product.id)
await addToCart(product.id)
await addToWishlist(product.id)
await removeFromWishlist(product.id)
```

**Authentication check:**
```typescript
// OLD - Don't use localStorage for auth
const customer = getCustomer()
if (!customer) { /* show login */ }

// NEW - Check session from backend
import { checkSession } from '@/lib/api'
const session = await checkSession()
if (!session.authenticated) { /* show login */ }
```

#### 2. ProductCard Component
**File**: `src/components/products/ProductCard.tsx`

Same updates as ProductDetail - remove `shopId` and `customer.id` parameters.

#### 3. ProductReviews Component
**File**: `src/components/products/ProductReviews.tsx`

**Update review submission:**
```typescript
// OLD
body: JSON.stringify({
  productId,
  userId: shopId,
  customerName,
  rating,
  reviewText,
})

// NEW - userId extracted from session
body: JSON.stringify({
  productId,
  customerName,
  rating,
  reviewText,
})
```

**Update review check:**
```typescript
// OLD
`/api/reviews/check?productId=${productId}&userId=${shopId}&customerId=${customer.id}`

// NEW
`/api/reviews/check?productId=${productId}`
```

#### 4. CartContent Component
**File**: `src/components/cart/CartContent.tsx`

```typescript
// OLD
await updateCartQuantity(userId, customerId, itemId, quantity)
await removeFromCart(userId, customerId, itemId)
await clearCart(userId, customerId)

// NEW
await updateCartQuantity(itemId, quantity)
await removeFromCart(itemId)
await clearCart()
```

#### 5. WishlistContent Component
**File**: `src/components/wishlist/WishlistContent.tsx`

```typescript
// OLD
await removeFromWishlist(userId, customerId, productId)
await addToCart(userId, customerId, productId)

// NEW
await removeFromWishlist(productId)
await addToCart(productId)
```

## 🔐 Security Improvements

### Before (Insecure)
```typescript
// ❌ Anyone can fake this
localStorage.setItem('websiteCustomer', JSON.stringify({ id: 'fake-id' }))
fetch('/api/cart', { 
  body: JSON.stringify({ userId: 'any-user', customerId: 'any-customer' })
})
```

### After (Secure)
```typescript
// ✅ Session verified by backend
// HTTP-only cookie sent automatically
fetch('/api/cart', { 
  body: JSON.stringify({ productId: 'product-123' })
})
// Backend extracts userId/customerId from verified session
```

## 📝 Testing Checklist

- [ ] Login flow creates session cookie
- [ ] Add to cart works without passing userId/customerId
- [ ] Wishlist operations work
- [ ] Reviews submission requires authentication
- [ ] Callback requests require authentication
- [ ] Logout clears session
- [ ] Expired sessions are rejected
- [ ] Cart persists across page reloads (session cookie)

## 🚀 Next Steps

1. Update all frontend components listed above
2. Remove all `getCustomer()` functions that read from localStorage for auth
3. Use `checkSession()` API call to verify authentication
4. Test complete user flow: login → add to cart → wishlist → review
5. Verify session expiration (30 days)
6. Test logout functionality
