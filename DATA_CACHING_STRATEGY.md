# Data Caching Strategy: ISR vs Browser Caching

**Focus:** Data caching only (excluding images)  
**Generated:** February 15, 2026  
**Application:** website-nextjs (Next.js 14.0.4)

---

## Table of Contents

1. [Caching Strategy Overview](#caching-strategy-overview)
2. [ISR (Server-Side) Caching](#isr-server-side-caching)
3. [Browser (Client-Side) Caching](#browser-client-side-caching)
4. [Implementation Guide](#implementation-guide)
5. [Cache Invalidation](#cache-invalidation)

---

## Caching Strategy Overview

### Two-Tier Caching Approach

```
┌─────────────────────────────────────────────────────────────┐
│                    USER BROWSER                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  BROWSER CACHE (React Query)                       │     │
│  │  • Wishlist data (5 min)                          │     │
│  │  • Cart data (2 min)                              │     │
│  │  • User session (5 min)                           │     │
│  │  • Recently viewed products (10 min)              │     │
│  │  • Product reviews (5 min)                        │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────┼────────────────────────────────────────────┘
                  │
                  │ API Requests (90% cached)
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              VERCEL EDGE NETWORK (ISR)                       │
│  ┌────────────────────────────────────────────────────┐     │
│  │  ISR CACHE (Server-Side)                          │     │
│  │  • Static pages (1 day)                           │     │
│  │  • Product pages (1 hour)                         │     │
│  │  • Home page (1 hour)                             │     │
│  │  • Category pages (1 hour)                        │     │
│  │  • Collection pages (1 hour)                      │     │
│  │  • API responses (5-60 min)                       │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────┼────────────────────────────────────────────┘
                  │
                  │ Cache miss only (10%)
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   SUPABASE DATABASE                          │
│              (Source of truth)                               │
└─────────────────────────────────────────────────────────────┘
```

---

## ISR (Server-Side) Caching

### What is ISR?

**Incremental Static Regeneration (ISR)** allows you to:
- Generate static pages at build time
- Revalidate and update them in the background
- Serve cached pages from Vercel Edge (CDN)
- Update stale pages without rebuilding entire site

### ISR Candidates (Pages & Data)

#### ✅ Perfect for ISR

| Content Type | Revalidate Time | Reason |
|--------------|-----------------|--------|
| **Static Pages** | 86400s (1 day) | Rarely change, same for all users |
| **Product Detail Pages** | 3600s (1 hour) | Change occasionally, high traffic |
| **Home Page** | 3600s (1 hour) | Semi-static, high traffic |
| **Category Pages** | 3600s (1 hour) | Change occasionally |
| **Collection Pages** | 3600s (1 hour) | Change occasionally |
| **About/Our Story** | 86400s (1 day) | Rarely change |

---

### 1. Static Pages (Highest Priority)

**Pages:**
- Privacy Policy (`/[domain]/privacy`)
- Terms of Service (`/[domain]/terms`)
- FAQs (`/[domain]/faqs`)
- Shipping & Returns (`/[domain]/shipping`)
- Refund Policy (`/[domain]/refund`)
- Warranty (`/[domain]/warranty`)
- Careers (`/[domain]/careers`)
- Press (`/[domain]/press`)

**Current State:**
```typescript
export const revalidate = 0  // ❌ No caching
```

**Optimized:**
```typescript
export const revalidate = 86400  // ✅ Cache for 1 day (24 hours)
```

**Data Cached:**
- User/website info
- Page content from `user_website_pages` table
- Footer data

**Benefits:**
- Pages served from edge in <50ms
- Zero database queries for cached pages
- Automatic revalidation after 24 hours
- Stale-while-revalidate (users never wait)

**Implementation:**

```typescript
// src/app/[domain]/privacy/page.tsx
// src/app/[domain]/terms/page.tsx
// src/app/[domain]/faqs/page.tsx
// etc.

export const revalidate = 86400 // 24 hours

export default async function PrivacyPage({ params }: PageProps) {
  const user = await getWebsiteByDomain(params.domain)
  if (!user) notFound()
  
  const pageData = await getPageData(user.id, 'privacy')
  
  return <EditableStaticPage user={user} pageData={pageData} />
}
```

---

### 2. Product Detail Pages

**Page:** `/[domain]/products/[productId]`

**Current State:**
```typescript
// No explicit revalidate - defaults to dynamic
```

**Optimized:**
```typescript
export const revalidate = 3600  // ✅ Cache for 1 hour

// Pre-generate top 100 products at build time
export async function generateStaticParams() {
  const topProducts = await getTopProducts(100)
  return topProducts.map(p => ({
    domain: p.shop_domain,
    productId: p.id
  }))
}
```

**Data Cached:**
- Product details
- Product reviews
- Related products
- User/website info

**Benefits:**
- Top products pre-generated (instant load)
- Other products cached after first visit
- Reviews cached (don't change frequently)
- 1-hour revalidation keeps data fresh

**Implementation:**

```typescript
// src/app/[domain]/products/[productId]/page.tsx

export const revalidate = 3600 // 1 hour

// Pre-generate top products
export async function generateStaticParams() {
  // Get top 100 most viewed/popular products
  const { data: topProducts } = await supabase
    .from('products')
    .select('id, user_id, users!inner(shop_domain)')
    .eq('show_on_website', true)
    .order('created_at', { ascending: false })
    .limit(100)
  
  return topProducts?.map(p => ({
    domain: p.users.shop_domain,
    productId: p.id
  })) || []
}

export default async function ProductPage({ params }: PageProps) {
  const { product, isDemo } = await getProductByIdWithDemoFallback(params.productId)
  
  if (!product) notFound()
  
  // These will be cached for 1 hour
  const reviews = await getProductReviews(product.id, product.user_id)
  const relatedProducts = await getRelatedProducts(
    product.user_id,
    product.category,
    product.id
  )
  
  return (
    <ProductDetail
      product={product}
      reviews={reviews}
      relatedProducts={relatedProducts}
      isDemo={isDemo}
    />
  )
}
```

---

### 3. Home Page

**Page:** `/[domain]`

**Current State:**
```typescript
export const dynamic = 'force-dynamic'  // ❌ Forces SSR
export const revalidate = 0             // ❌ No caching
```

**Optimized:**
```typescript
// Remove force-dynamic
export const revalidate = 3600  // ✅ Cache for 1 hour
```

**Data Cached:**
- Website render data (user, website, template, sections)
- Hero collections
- Categories
- New arrivals products
- Trending products
- Testimonials
- Footer data

**Benefits:**
- First visitor: ~500ms (cache miss)
- Subsequent visitors: 50-100ms (edge cache hit)
- Background revalidation after 1 hour
- No downtime during updates

**Implementation:**

```typescript
// src/app/[domain]/page.tsx

// Remove these lines:
// export const dynamic = 'force-dynamic'
// export const revalidate = 0

// Add this:
export const revalidate = 3600 // 1 hour

export default async function StorePage({ params }: PageProps) {
  if (!isValidDomain(params.domain)) {
    notFound()
  }

  // All this data will be cached for 1 hour
  const renderData = await getWebsiteRenderData(params.domain)
  
  if (!renderData) {
    notFound()
  }

  const { user, website, template, sections } = renderData

  // Get collections from merged sections
  const heroCollectionsFromSections = getHeroFromSections(sections)
  const trendingCollectionsFromSections = getTrendingFromSections(sections)
  const categoryCollections = getCategoryCollections(sections)
  const bestCollectionsFromSections = getBestFromSections(sections)
  
  // ... rest of implementation
  
  return (
    <WebsiteLayout user={user} template={template} sections={sections}>
      {/* All sections rendered with cached data */}
    </WebsiteLayout>
  )
}
```

---

### 4. Category Pages

**Page:** `/[domain]/categories/[categoryName]`

**Optimized:**
```typescript
export const revalidate = 3600 // 1 hour
```

**Data Cached:**
- Products in category
- Category metadata
- User/website info

**Implementation:**

```typescript
// src/app/[domain]/categories/[categoryName]/page.tsx

export const revalidate = 3600 // 1 hour

export default async function CategoryPage({ params }: PageProps) {
  const categoryName = decodeURIComponent(params.categoryName).replace(/-/g, ' ')
  const user = await getWebsiteByDomain(params.domain)
  
  if (!user) notFound()
  
  // Products cached for 1 hour
  const { products, isDemo } = await getProductsWithDemoFallback(
    user.id,
    { category: categoryName, showOnWebsite: true }
  )
  
  return (
    <div>
      <h1>{categoryName}</h1>
      <ProductsGrid products={products} isDemo={isDemo} />
    </div>
  )
}
```

---

### 5. Collection Pages

**Page:** `/[domain]/collections/[collectionName]`

**Optimized:**
```typescript
export const revalidate = 3600 // 1 hour
```

**Data Cached:**
- Products in collection
- Collection metadata
- User/website info

---

### 6. API Routes (Read-Only)

**APIs that should use ISR-style caching:**

#### Products API

```typescript
// src/app/api/products/route.ts

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const category = searchParams.get('category')
  
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 })
  }
  
  const products = await getProducts(userId, { category, showOnWebsite: true })
  
  return NextResponse.json({ products }, {
    headers: {
      // Cache at edge for 30 minutes
      // Serve stale for 1 hour while revalidating
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      'CDN-Cache-Control': 'public, s-maxage=1800',
    }
  })
}
```

#### Reviews API

```typescript
// src/app/api/reviews/route.ts

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const productId = searchParams.get('productId')
  
  const reviews = await getProductReviews(productId)
  
  return NextResponse.json({ reviews }, {
    headers: {
      // Cache for 30 minutes (reviews don't change often)
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
    }
  })
}
```

---

## Browser (Client-Side) Caching

### What is Browser Caching?

**Browser caching** stores data in the user's browser using:
- React Query (for API data)
- LocalStorage (for session data)
- Memory cache (for temporary data)

### Browser Caching Candidates

#### ✅ Perfect for Browser Caching

| Data Type | Cache Duration | Reason |
|-----------|----------------|--------|
| **Wishlist** | 5 min | User-specific, changes frequently |
| **Cart** | 2 min | User-specific, changes very frequently |
| **User Session** | 5 min | User-specific, needs to stay fresh |
| **Recently Viewed** | 10 min | User-specific, low priority |
| **Product Reviews (client fetch)** | 5 min | Can be stale, low priority |
| **Search Results** | 5 min | User-specific, temporary |

---

### 1. Wishlist (Highest Priority)

**Current State:**
- No client-side caching
- Every navigation refetches wishlist

**Optimized with React Query:**

```typescript
// src/components/wishlist/WishlistContent.tsx

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function WishlistContent() {
  const queryClient = useQueryClient()
  
  // Fetch wishlist with 5-minute cache
  const { data: wishlist, isLoading, error } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const res = await fetch('/api/wishlist')
      if (!res.ok) throw new Error('Failed to fetch wishlist')
      return res.json()
    },
    staleTime: 5 * 60 * 1000,      // Fresh for 5 minutes
    cacheTime: 10 * 60 * 1000,     // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,    // Don't refetch on focus
  })
  
  // Add to wishlist with optimistic update
  const addMutation = useMutation({
    mutationFn: async (productId: string) => {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })
      if (!res.ok) throw new Error('Failed to add to wishlist')
      return res.json()
    },
    // Optimistic update - instant UI feedback
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: ['wishlist'] })
      const previous = queryClient.getQueryData(['wishlist'])
      
      queryClient.setQueryData(['wishlist'], (old: any) => ({
        ...old,
        items: [...(old?.items || []), { product_id: productId }]
      }))
      
      return { previous }
    },
    // Rollback on error
    onError: (err, variables, context) => {
      queryClient.setQueryData(['wishlist'], context?.previous)
    },
    // Refetch to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
    },
  })
  
  // Remove from wishlist
  const removeMutation = useMutation({
    mutationFn: async (productId: string) => {
      const res = await fetch('/api/wishlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })
      if (!res.ok) throw new Error('Failed to remove from wishlist')
      return res.json()
    },
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: ['wishlist'] })
      const previous = queryClient.getQueryData(['wishlist'])
      
      queryClient.setQueryData(['wishlist'], (old: any) => ({
        ...old,
        items: old?.items?.filter((item: any) => item.product_id !== productId) || []
      }))
      
      return { previous }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['wishlist'], context?.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
    },
  })
  
  return (
    <div>
      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage />}
      {wishlist?.items?.map((item: any) => (
        <WishlistItem
          key={item.product_id}
          item={item}
          onRemove={() => removeMutation.mutate(item.product_id)}
        />
      ))}
    </div>
  )
}
```

**Benefits:**
- Instant navigation (data cached)
- Optimistic updates (instant UI feedback)
- Automatic background refetch
- Error handling with rollback

---

### 2. Cart

**Optimized with React Query:**

```typescript
// src/components/cart/CartContent.tsx

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function CartContent() {
  const queryClient = useQueryClient()
  
  // Fetch cart with 2-minute cache (more frequent updates than wishlist)
  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const res = await fetch('/api/cart')
      if (!res.ok) throw new Error('Failed to fetch cart')
      return res.json()
    },
    staleTime: 2 * 60 * 1000,      // Fresh for 2 minutes
    cacheTime: 5 * 60 * 1000,      // Keep in cache for 5 minutes
    refetchOnWindowFocus: true,     // Refetch on focus (cart changes often)
  })
  
  // Add to cart
  const addMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity }),
      })
      if (!res.ok) throw new Error('Failed to add to cart')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
  
  // Update quantity
  const updateMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      const res = await fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity }),
      })
      if (!res.ok) throw new Error('Failed to update cart')
      return res.json()
    },
    onMutate: async ({ productId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] })
      const previous = queryClient.getQueryData(['cart'])
      
      queryClient.setQueryData(['cart'], (old: any) => ({
        ...old,
        items: old?.items?.map((item: any) =>
          item.product_id === productId
            ? { ...item, quantity }
            : item
        ) || []
      }))
      
      return { previous }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['cart'], context?.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
  
  // Remove from cart
  const removeMutation = useMutation({
    mutationFn: async (productId: string) => {
      const res = await fetch('/api/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })
      if (!res.ok) throw new Error('Failed to remove from cart')
      return res.json()
    },
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] })
      const previous = queryClient.getQueryData(['cart'])
      
      queryClient.setQueryData(['cart'], (old: any) => ({
        ...old,
        items: old?.items?.filter((item: any) => item.product_id !== productId) || []
      }))
      
      return { previous }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['cart'], context?.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
  
  return (
    <div>
      {/* Cart UI */}
    </div>
  )
}
```

---

### 3. Product Reviews (Client-Side Fetch)

**When to use browser caching for reviews:**
- Reviews loaded via client-side fetch (not SSR)
- Reviews section below the fold
- Reviews can be slightly stale

```typescript
// src/components/products/ProductReviews.tsx

'use client'

import { useQuery } from '@tanstack/react-query'

interface ProductReviewsProps {
  productId: string
  userId: string
}

export function ProductReviews({ productId, userId }: ProductReviewsProps) {
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      const res = await fetch(`/api/reviews?productId=${productId}&userId=${userId}`)
      if (!res.ok) throw new Error('Failed to fetch reviews')
      return res.json()
    },
    staleTime: 5 * 60 * 1000,      // Fresh for 5 minutes
    cacheTime: 10 * 60 * 1000,     // Keep in cache for 10 minutes
  })
  
  return (
    <div>
      {isLoading && <ReviewsSkeleton />}
      {reviews?.reviews?.map((review: any) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  )
}
```

---

### 4. Search Results

```typescript
// src/components/sections/SearchBar.tsx

'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

export function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('')
  
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return { products: [] }
      
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      if (!res.ok) throw new Error('Search failed')
      return res.json()
    },
    enabled: searchQuery.length > 2,  // Only search if 3+ characters
    staleTime: 5 * 60 * 1000,         // Fresh for 5 minutes
    cacheTime: 10 * 60 * 1000,        // Keep in cache for 10 minutes
  })
  
  return (
    <div>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search products..."
      />
      {isLoading && <SearchSpinner />}
      {searchResults?.products?.map((product: any) => (
        <SearchResultItem key={product.id} product={product} />
      ))}
    </div>
  )
}
```

---

### 5. User Session (Already Implemented)

**Current Implementation:**
```typescript
// src/contexts/CustomerContext.tsx

localStorage.setItem('customerData', JSON.stringify({
  ...session.customer,
  timestamp: Date.now()
}))
```

**Keep this as-is** - LocalStorage is appropriate for session data.

---

## Implementation Guide

### Phase 1: ISR Setup (Week 1)

#### Day 1: Static Pages

**Files to modify:**
- `src/app/[domain]/privacy/page.tsx`
- `src/app/[domain]/terms/page.tsx`
- `src/app/[domain]/faqs/page.tsx`
- `src/app/[domain]/shipping/page.tsx`
- `src/app/[domain]/refund/page.tsx`
- `src/app/[domain]/warranty/page.tsx`
- `src/app/[domain]/careers/page.tsx`
- `src/app/[domain]/press/page.tsx`
- `src/app/[domain]/our-story/page.tsx`

**Change:**
```typescript
// From:
export const revalidate = 0

// To:
export const revalidate = 86400 // 24 hours
```

**Expected Result:**
- Static pages load in <50ms
- Zero DB queries for cached pages
- 100% improvement

---

#### Day 2: Product Detail Pages

**File to modify:**
- `src/app/[domain]/products/[productId]/page.tsx`

**Add:**
```typescript
export const revalidate = 3600 // 1 hour

export async function generateStaticParams() {
  // Pre-generate top 100 products
  const { data: topProducts } = await supabase
    .from('products')
    .select('id, user_id, users!inner(shop_domain)')
    .eq('show_on_website', true)
    .order('created_at', { ascending: false })
    .limit(100)
  
  return topProducts?.map(p => ({
    domain: p.users.shop_domain,
    productId: p.id
  })) || []
}
```

**Expected Result:**
- Top 100 products pre-generated
- Product pages cached for 1 hour
- 80% reduction in load time

---

#### Day 3: Home Page

**File to modify:**
- `src/app/[domain]/page.tsx`

**Change:**
```typescript
// Remove:
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Add:
export const revalidate = 3600 // 1 hour
```

**Expected Result:**
- Home page cached for 1 hour
- 10x faster page loads
- 90% reduction in DB queries

---

#### Day 4: Category & Collection Pages

**Files to modify:**
- `src/app/[domain]/categories/[categoryName]/page.tsx`
- `src/app/[domain]/collections/[collectionName]/page.tsx`

**Add:**
```typescript
export const revalidate = 3600 // 1 hour
```

---

#### Day 5: API Response Caching

**Files to modify:**
- `src/app/api/products/route.ts` (if exists)
- `src/app/api/reviews/route.ts`
- Any other read-only API routes

**Add cache headers:**
```typescript
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
  }
})
```

---

### Phase 2: Browser Caching Setup (Week 2)

#### Day 1-2: Install React Query

```bash
npm install @tanstack/react-query
```

**Create provider:**

```typescript
// src/app/providers.tsx (new file)

'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,        // 5 minutes
        cacheTime: 10 * 60 * 1000,       // 10 minutes
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: 1,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

**Update root layout:**

```typescript
// src/app/layout.tsx

import { Providers } from './providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

---

#### Day 3: Migrate Wishlist

**File to modify:**
- `src/components/wishlist/WishlistContent.tsx`

**Implement React Query** (see code example above)

---

#### Day 4: Migrate Cart

**File to modify:**
- `src/components/cart/CartContent.tsx`

**Implement React Query** (see code example above)

---

#### Day 5: Migrate Reviews & Search

**Files to modify:**
- `src/components/products/ProductReviews.tsx`
- `src/components/sections/SearchBar.tsx`

**Implement React Query** (see code examples above)

---

## Cache Invalidation

### When to Invalidate ISR Cache

| Action | How to Invalidate |
|--------|-------------------|
| Product updated | `revalidatePath('/[domain]/products/[productId]')` |
| Collection updated | `revalidatePath('/[domain]')` |
| Section updated | `revalidatePath('/[domain]')` |
| Static page updated | `revalidatePath('/[domain]/privacy')` |

### Implementation

```typescript
// In editor API routes

import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  // Update product
  await supabase
    .from('products')
    .update(data)
    .eq('id', productId)
  
  // Invalidate ISR cache
  revalidatePath(`/[domain]/products/${productId}`)
  revalidatePath('/[domain]') // Also invalidate home page
  
  return NextResponse.json({ success: true })
}
```

### When to Invalidate Browser Cache

React Query automatically invalidates cache when:
- Mutation succeeds (`onSuccess`)
- Manual invalidation (`queryClient.invalidateQueries`)
- Cache expires (staleTime)

**Manual invalidation:**

```typescript
// After adding product to wishlist
queryClient.invalidateQueries({ queryKey: ['wishlist'] })

// After updating cart
queryClient.invalidateQueries({ queryKey: ['cart'] })

// After submitting review
queryClient.invalidateQueries({ queryKey: ['reviews', productId] })
```

---

## Summary: ISR vs Browser Caching

### Use ISR (Server-Side) For:

✅ **Static pages** - Same content for all users  
✅ **Product pages** - High traffic, change occasionally  
✅ **Home page** - High traffic, semi-static  
✅ **Category/Collection pages** - Change occasionally  
✅ **API responses** - Read-only, can be stale  

**Benefits:**
- Served from edge (fast globally)
- Reduces database load
- Automatic revalidation
- No client-side code needed

---

### Use Browser Caching (Client-Side) For:

✅ **Wishlist** - User-specific, changes frequently  
✅ **Cart** - User-specific, changes very frequently  
✅ **Search results** - User-specific, temporary  
✅ **User session** - User-specific, needs to stay fresh  
✅ **Recently viewed** - User-specific, low priority  

**Benefits:**
- Instant navigation
- Optimistic updates
- Offline support
- Reduces API calls

---

## Expected Performance

### Before Optimization

| Metric | Current |
|--------|---------|
| Home Page TTFB | 500-1000ms |
| Product Page TTFB | 300-600ms |
| Static Page TTFB | 200-400ms |
| DB Queries/Page | 10+ |
| Cache Hit Rate | 0% |

### After Optimization

| Metric | Target | Improvement |
|--------|--------|-------------|
| Home Page TTFB | 50-100ms | **10x faster** |
| Product Page TTFB | 50-100ms | **6x faster** |
| Static Page TTFB | <50ms | **8x faster** |
| DB Queries/Page | <1 | **90%+ reduction** |
| Cache Hit Rate | 90%+ | **∞ improvement** |

---

**Document Version:** 1.0  
**Last Updated:** February 15, 2026  
**Focus:** Data caching only (images excluded)
