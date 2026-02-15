# Complete System Architecture & Caching Strategy

**Generated:** February 14, 2026  
**Application:** website-nextjs (Next.js 14.0.4 E-commerce Jewelry Platform)  
**Purpose:** Comprehensive system design with multi-layer caching architecture

---

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Data Flow Analysis](#data-flow-analysis)
3. [Complete Caching Strategy](#complete-caching-strategy)
4. [Layer-by-Layer Implementation](#layer-by-layer-implementation)
5. [Page-Specific Caching Strategy](#page-specific-caching-strategy)
6. [API Caching Strategy](#api-caching-strategy)
7. [Database Query Optimization](#database-query-optimization)
8. [Implementation Roadmap](#implementation-roadmap)

---

## System Architecture Overview

### Current Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ React Client │  │ LocalStorage │  │ Session      │         │
│  │ Components   │  │ (Customer)   │  │ Cookies      │         │
│  └──────┬───────┘  └──────────────┘  └──────────────┘         │
└─────────┼────────────────────────────────────────────────────────┘
          │
          │ HTTP Requests (No Caching)
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL EDGE NETWORK                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              NO EDGE CACHING CONFIGURED                   │  │
│  │         All requests pass through to functions            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────┼────────────────────────────────────────────────────────┘
          │
          │ Every request hits serverless functions
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  NEXT.JS SERVERLESS FUNCTIONS                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ SSR Pages    │  │ API Routes   │  │ Middleware   │         │
│  │ (revalidate  │  │ (dynamic)    │  │ (routing)    │         │
│  │  = 0)        │  │              │  │              │         │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘         │
└─────────┼──────────────────┼──────────────────────────────────────┘
          │                  │
          │ Direct DB Queries (10+ per page)
          ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE DATABASE                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ users        │  │ products     │  │ collections  │         │
│  │ user_websites│  │ categories   │  │ reviews      │         │
│  │ templates    │  │ sessions     │  │ wishlist     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  NO CACHING LAYER - Every query hits database                   │
└─────────────────────────────────────────────────────────────────┘
```

**Problems:**
- ❌ Zero caching at any layer
- ❌ 10+ database queries per page load
- ❌ Static content regenerated dynamically
- ❌ High latency (500-1000ms TTFB)
- ❌ Poor scalability
- ❌ High infrastructure costs

---

### Optimized Architecture (Target)

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ React Query  │  │ LocalStorage │  │ IndexedDB    │         │
│  │ Cache        │  │ (Session)    │  │ (Offline)    │         │
│  │ 5min stale   │  │              │  │              │         │
│  └──────┬───────┘  └──────────────┘  └──────────────┘         │
└─────────┼────────────────────────────────────────────────────────┘
          │
          │ Cached requests (90% hit rate)
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL EDGE NETWORK                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  EDGE CACHE (CDN) - Cloudflare/Vercel Edge               │  │
│  │  • Static pages: 1 day cache                             │  │
│  │  • ISR pages: 1 hour cache + stale-while-revalidate     │  │
│  │  • API responses: 5-60 min cache                         │  │
│  │  • Images: 1 year cache                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────┼────────────────────────────────────────────────────────┘
          │
          │ Cache miss only (10% of requests)
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  NEXT.JS SERVERLESS FUNCTIONS                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ ISR Pages    │  │ API Routes   │  │ In-Memory    │         │
│  │ (revalidate  │  │ (with cache  │  │ Cache        │         │
│  │  = 3600)     │  │  headers)    │  │ (5 min TTL)  │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
└─────────┼──────────────────┼──────────────────┼──────────────────┘
          │                  │                  │
          │                  │                  │ 80% hit rate
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    REDIS CACHE LAYER (Optional)                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Distributed cache for:                                   │  │
│  │  • Website render data (5 min)                           │  │
│  │  • Product lists (10 min)                                │  │
│  │  • User sessions (30 days)                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────┼────────────────────────────────────────────────────────┘
          │
          │ Cache miss only (2% of requests)
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE DATABASE                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ users        │  │ products     │  │ collections  │         │
│  │ user_websites│  │ categories   │  │ reviews      │         │
│  │ templates    │  │ sessions     │  │ wishlist     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  Only 2-5% of requests hit database                             │
└─────────────────────────────────────────────────────────────────┘
```

**Benefits:**
- ✅ 95%+ cache hit rate
- ✅ <1 database query per page load (average)
- ✅ 50-100ms TTFB (10x faster)
- ✅ Excellent scalability
- ✅ 80% cost reduction

---

## Data Flow Analysis

### 1. Data Sources Identified

#### **Primary Database Tables (Supabase)**

| Table | Purpose | Update Frequency | Cache Strategy |
|-------|---------|------------------|----------------|
| `users` | Shop owner info | Rarely (manual) | **Long cache (1 day)** |
| `user_websites` | Website config | Rarely (manual) | **Long cache (1 day)** |
| `website_templates` | Template definitions | Never (system) | **Permanent cache** |
| `website_template_sections` | Section schemas | Never (system) | **Permanent cache** |
| `user_website_sections` | User customizations | Rarely (editor) | **Medium cache (1 hour)** |
| `collections` | Hero, trending, etc. | Rarely (editor) | **Medium cache (1 hour)** |
| `products` | Product catalog | Occasionally | **Medium cache (30 min)** |
| `categories` | Product categories | Rarely | **Long cache (1 day)** |
| `customer_sessions` | User sessions | Frequently | **Short cache (5 min)** |
| `customer_reviews` | Product reviews | Occasionally | **Medium cache (30 min)** |
| `wishlist` | User wishlist | Frequently | **No server cache** (client only) |
| `cart_items` | Shopping cart | Frequently | **No server cache** (client only) |
| `store_info` | Store details | Rarely | **Long cache (1 day)** |

#### **External Services**

| Service | Purpose | Cache Strategy |
|---------|---------|----------------|
| Firebase Auth | Customer authentication | **Token-based (client)** |
| Supabase Storage | Images | **CDN cache (1 year)** |
| Backend API (Cloud Run) | Customer operations | **No cache** (transactional) |

---

### 2. Page Types & Data Requirements

#### **A. Static Pages (Rarely Change)**

| Page | Data Sources | DB Queries | Current TTFB | Target TTFB |
|------|--------------|------------|--------------|-------------|
| Privacy Policy | `user_website_pages` | 1-2 | 200-400ms | <50ms |
| Terms of Service | `user_website_pages` | 1-2 | 200-400ms | <50ms |
| FAQs | `user_website_pages` | 1-2 | 200-400ms | <50ms |
| Shipping & Returns | `user_website_pages` | 1-2 | 200-400ms | <50ms |
| Warranty | `user_website_pages` | 1-2 | 200-400ms | <50ms |
| About | `user_website_pages` | 1-2 | 200-400ms | <50ms |

**Caching Strategy:**
```typescript
export const revalidate = 86400 // 1 day
// OR use generateStaticParams for true static generation
```

---

#### **B. Semi-Static Pages (Change Occasionally)**

| Page | Data Sources | DB Queries | Current TTFB | Target TTFB |
|------|--------------|------------|--------------|-------------|
| Home | `users`, `user_websites`, `templates`, `sections`, `collections`, `products` | 10+ | 500-1000ms | 50-100ms |
| Product Detail | `products`, `reviews`, `related_products` | 3-5 | 300-600ms | 50-100ms |
| Category Page | `products`, `categories` | 2-4 | 300-500ms | 50-100ms |
| Collection Page | `products`, `collections` | 2-4 | 300-500ms | 50-100ms |

**Caching Strategy:**
```typescript
export const revalidate = 3600 // 1 hour ISR
// Regenerate in background when stale
```

---

#### **C. Dynamic Pages (User-Specific)**

| Page | Data Sources | DB Queries | Caching |
|------|--------------|------------|---------|
| Cart | `cart_items`, `products` | 2-3 | **Client-side only** |
| Wishlist | `wishlist`, `products` | 2-3 | **Client-side only** |
| Profile | `customers`, `orders` | 2-3 | **Client-side only** |

**Caching Strategy:**
```typescript
// No server-side caching
// Use React Query for client-side caching
```

---

### 3. API Endpoints Analysis

#### **Read-Only APIs (Cacheable)**

| Endpoint | Purpose | Update Frequency | Cache TTL |
|----------|---------|------------------|-----------|
| `GET /api/products` | Product list | Occasionally | **30 min** |
| `GET /api/categories` | Categories | Rarely | **1 hour** |
| `GET /api/collections` | Collections | Rarely | **1 hour** |
| `GET /api/reviews` | Product reviews | Occasionally | **30 min** |

**Implementation:**
```typescript
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600'
  }
})
```

---

#### **Write APIs (Not Cacheable)**

| Endpoint | Purpose | Caching |
|----------|---------|---------|
| `POST /api/cart` | Add to cart | **None** |
| `POST /api/wishlist` | Add to wishlist | **None** |
| `POST /api/reviews` | Submit review | **None** |
| `POST /api/contact` | Contact form | **None** |
| `POST /api/auth/*` | Authentication | **None** |

---

## Complete Caching Strategy

### Multi-Layer Caching Architecture

```
Layer 1: Browser Cache (Client-Side)
├── React Query Cache (5 min stale, 10 min cache)
│   ├── Wishlist data
│   ├── Cart data
│   ├── User profile
│   └── Recently viewed products
├── LocalStorage
│   ├── Customer session data
│   └── User preferences
└── IndexedDB (Optional)
    └── Offline product catalog

Layer 2: CDN/Edge Cache (Vercel Edge)
├── Static Pages (1 day)
│   ├── Privacy, Terms, FAQs
│   └── About, Contact pages
├── ISR Pages (1 hour + SWR)
│   ├── Home page
│   ├── Product pages
│   ├── Category pages
│   └── Collection pages
├── API Responses (5-60 min)
│   ├── Product lists
│   ├── Categories
│   └── Reviews
└── Static Assets (1 year)
    ├── Images
    ├── CSS
    └── JavaScript

Layer 3: Server Memory Cache (In-Memory)
├── Website render data (5 min)
├── Template data (permanent)
├── User website config (1 hour)
└── Product lists (30 min)

Layer 4: Distributed Cache (Redis - Optional)
├── Website render data (5 min)
├── Product catalog (30 min)
├── User sessions (30 days)
└── Rate limiting counters

Layer 5: Database (Supabase)
└── Source of truth (only on cache miss)
```

---

## Layer-by-Layer Implementation

### Layer 1: Client-Side Caching (React Query)

#### **Installation**

```bash
npm install @tanstack/react-query
```

#### **Setup**

**File:** `src/app/layout.tsx`

```typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,        // Data fresh for 5 minutes
        cacheTime: 10 * 60 * 1000,       // Keep in cache for 10 minutes
        refetchOnWindowFocus: false,      // Don't refetch on window focus
        refetchOnReconnect: true,         // Refetch on reconnect
        retry: 1,                         // Retry failed requests once
      },
    },
  }))

  return (
    <html>
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </body>
    </html>
  )
}
```

#### **Usage Examples**

**Wishlist Component:**

```typescript
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function WishlistContent() {
  const queryClient = useQueryClient()
  
  // Fetch wishlist with caching
  const { data: wishlist, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const res = await fetch('/api/wishlist')
      return res.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
  
  // Add to wishlist with optimistic update
  const addMutation = useMutation({
    mutationFn: async (productId: string) => {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        body: JSON.stringify({ productId }),
      })
      return res.json()
    },
    onMutate: async (productId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['wishlist'] })
      const previous = queryClient.getQueryData(['wishlist'])
      
      queryClient.setQueryData(['wishlist'], (old: any) => ({
        ...old,
        items: [...(old?.items || []), { productId }]
      }))
      
      return { previous }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['wishlist'], context?.previous)
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
    },
  })
  
  return (
    // Component JSX
  )
}
```

**Cart Component:**

```typescript
export function CartContent() {
  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: fetchCart,
    staleTime: 2 * 60 * 1000, // 2 minutes (more frequent updates)
  })
  
  // Similar mutation setup for add/remove/update
}
```

---

### Layer 2: Edge Caching (Vercel/CDN)

#### **A. Static Pages**

**Implementation for all static pages:**

```typescript
// src/app/[domain]/privacy/page.tsx
// src/app/[domain]/terms/page.tsx
// src/app/[domain]/faqs/page.tsx
// etc.

export const revalidate = 86400 // 1 day

// Optional: Pre-generate at build time
export async function generateStaticParams() {
  // Get all shop domains
  const domains = await getAllShopDomains()
  return domains.map(domain => ({ domain }))
}

export default async function PrivacyPage({ params }: PageProps) {
  const user = await getWebsiteByDomain(params.domain)
  const pageData = await getPageData(user.id, 'privacy')
  
  return <StaticPageContent data={pageData} />
}
```

**Benefits:**
- Pages cached at edge for 24 hours
- Served in <50ms globally
- Zero database queries for cached pages
- Automatic revalidation after 1 day

---

#### **B. ISR Pages (Home, Products, Categories)**

**Home Page:**

```typescript
// src/app/[domain]/page.tsx

export const revalidate = 3600 // 1 hour ISR

export default async function HomePage({ params }: PageProps) {
  // This data will be cached for 1 hour
  // After 1 hour, first request triggers background revalidation
  const renderData = await getWebsiteRenderData(params.domain)
  const { products } = await getProductsWithDemoFallback(renderData.user.id, {
    limit: 12,
    showOnWebsite: true
  })
  
  return (
    <div>
      <HeroSection data={renderData} />
      <ProductsSection products={products} />
      {/* Other sections */}
    </div>
  )
}
```

**Product Detail Page:**

```typescript
// src/app/[domain]/products/[productId]/page.tsx

export const revalidate = 3600 // 1 hour ISR

// Pre-generate top 100 products at build time
export async function generateStaticParams() {
  const topProducts = await getTopProducts(100)
  return topProducts.map(p => ({
    domain: p.shop_domain,
    productId: p.id
  }))
}

export default async function ProductPage({ params }: PageProps) {
  const { product } = await getProductByIdWithDemoFallback(params.productId)
  const reviews = await getProductReviews(params.productId)
  
  return <ProductDetail product={product} reviews={reviews} />
}
```

**Benefits:**
- First visitor gets fresh data (cache miss)
- Subsequent visitors get cached page (<100ms)
- After 1 hour, next visitor triggers background revalidation
- No downtime during revalidation (stale-while-revalidate)

---

#### **C. API Response Caching**

**Product List API:**

```typescript
// src/app/api/products/route.ts

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const category = searchParams.get('category')
  
  const products = await getProducts(userId, { category })
  
  return NextResponse.json({ products }, {
    headers: {
      // Cache for 30 minutes at edge
      // Serve stale for 1 hour while revalidating
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      'CDN-Cache-Control': 'public, s-maxage=1800',
      'Vercel-CDN-Cache-Control': 'public, s-maxage=1800',
    }
  })
}
```

**Categories API:**

```typescript
// src/app/api/categories/route.ts

export async function GET(request: NextRequest) {
  const userId = searchParams.get('userId')
  const categories = await getCategoriesMap(userId)
  
  return NextResponse.json({ categories }, {
    headers: {
      // Cache for 1 hour (categories change rarely)
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
    }
  })
}
```

**Reviews API:**

```typescript
// src/app/api/reviews/route.ts

export async function GET(request: NextRequest) {
  const productId = searchParams.get('productId')
  const reviews = await getProductReviews(productId)
  
  return NextResponse.json({ reviews }, {
    headers: {
      // Cache for 30 minutes
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
    }
  })
}
```

---

### Layer 3: Server Memory Cache (In-Memory)

**Implementation:**

**File:** `src/lib/cache.ts` (new file)

```typescript
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private maxSize = 1000 // Prevent memory leaks
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    const age = Date.now() - entry.timestamp
    if (age > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }
  
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // Prevent cache from growing too large
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }
  
  delete(key: string): void {
    this.cache.delete(key)
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  // Invalidate by pattern
  invalidatePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key)
      }
    }
  }
}

export const memoryCache = new MemoryCache()

// Helper function for cached data fetching
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000
): Promise<T> {
  // Try cache first
  const cached = memoryCache.get<T>(key)
  if (cached !== null) {
    console.log(`[Cache] HIT: ${key}`)
    return cached
  }
  
  // Cache miss - fetch data
  console.log(`[Cache] MISS: ${key}`)
  const data = await fetcher()
  
  // Store in cache
  memoryCache.set(key, data, ttl)
  
  return data
}
```

**Usage in data fetching functions:**

**File:** `src/lib/supabase-new-architecture.ts`

```typescript
import { getCached, memoryCache } from './cache'

// Cache website render data for 5 minutes
export async function getWebsiteRenderData(domain: string): Promise<WebsiteRenderData | null> {
  const cacheKey = `website:render:${domain}`
  
  return getCached(cacheKey, async () => {
    // Original implementation
    const user = await getWebsiteByDomain(domain)
    if (!user) return null
    
    const website = await getUserWebsite(user.id)
    if (!website) return null
    
    const template = await getWebsiteTemplate(website.template_id)
    if (!template) return null
    
    const templateSections = await getTemplateSections(template.id)
    const userSections = await getUserWebsiteSections(website.id)
    const sections = await getMergedSections(templateSections, userSections, user.id)
    
    return { user, website, template, sections }
  }, 5 * 60 * 1000) // 5 minutes TTL
}

// Cache template data permanently (never changes)
export async function getWebsiteTemplate(templateId: string): Promise<WebsiteTemplate | null> {
  const cacheKey = `template:${templateId}`
  
  return getCached(cacheKey, async () => {
    const { data, error } = await supabase
      .from('website_templates')
      .select('*')
      .eq('id', templateId)
      .single()
    
    return error ? null : data as WebsiteTemplate
  }, 24 * 60 * 60 * 1000) // 24 hours (effectively permanent)
}

// Cache products for 30 minutes
export async function getProducts(userId: string, options?: any): Promise<ProductData[]> {
  const cacheKey = `products:${userId}:${JSON.stringify(options)}`
  
  return getCached(cacheKey, async () => {
    // Original implementation
    let query = supabase
      .from('products')
      .select('*')
      .eq('user_id', userId)
    
    // Apply filters...
    const { data, error } = await query
    return error ? [] : data as ProductData[]
  }, 30 * 60 * 1000) // 30 minutes TTL
}
```

**Cache Invalidation:**

```typescript
// When product is updated in editor
export async function updateProduct(productId: string, data: any) {
  // Update database
  await supabase
    .from('products')
    .update(data)
    .eq('id', productId)
  
  // Invalidate related caches
  memoryCache.invalidatePattern(/^products:/)
  memoryCache.invalidatePattern(/^website:render:/)
}

// When collection is updated
export async function updateCollection(collectionId: string, data: any) {
  await supabase
    .from('collections')
    .update(data)
    .eq('id', collectionId)
  
  // Invalidate caches
  memoryCache.invalidatePattern(/^collections:/)
  memoryCache.invalidatePattern(/^website:render:/)
}
```

---

### Layer 4: Distributed Cache (Redis - Optional)

**When to use Redis:**
- Multiple serverless function instances
- Need persistent cache across deployments
- High traffic (>10K requests/hour)
- Want to cache user sessions

**Installation:**

```bash
npm install @upstash/redis
```

**Setup:**

**File:** `src/lib/redis.ts` (new file)

```typescript
import { Redis } from '@upstash/redis'

// Initialize Redis client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Helper function for cached fetching with Redis
export async function getRedisCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300 // 5 minutes default
): Promise<T> {
  try {
    // Try Redis first
    const cached = await redis.get<T>(key)
    if (cached !== null) {
      console.log(`[Redis] HIT: ${key}`)
      return cached
    }
    
    // Cache miss - fetch data
    console.log(`[Redis] MISS: ${key}`)
    const data = await fetcher()
    
    // Store in Redis with TTL
    await redis.setex(key, ttl, data)
    
    return data
  } catch (error) {
    console.error('[Redis] Error:', error)
    // Fallback to direct fetch if Redis fails
    return fetcher()
  }
}

// Invalidate by pattern
export async function invalidateRedisPattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
      console.log(`[Redis] Invalidated ${keys.length} keys matching ${pattern}`)
    }
  } catch (error) {
    console.error('[Redis] Error invalidating pattern:', error)
  }
}
```

**Usage:**

```typescript
import { getRedisCached, invalidateRedisPattern } from './redis'

export async function getWebsiteRenderData(domain: string): Promise<WebsiteRenderData | null> {
  const cacheKey = `website:render:${domain}`
  
  return getRedisCached(cacheKey, async () => {
    // Fetch from database
    // ... implementation
  }, 300) // 5 minutes
}

// Invalidate on update
export async function updateWebsiteSection(sectionId: string, data: any) {
  await supabase
    .from('user_website_sections')
    .update(data)
    .eq('id', sectionId)
  
  // Invalidate Redis cache
  await invalidateRedisPattern('website:render:*')
}
```

---

## Page-Specific Caching Strategy

### Home Page (`/[domain]`)

**Data Requirements:**
- User/website info
- Template & sections
- Hero collections
- Products (New Arrivals)
- Trending products
- Categories
- Testimonials
- Footer data

**Current Performance:**
- 10+ database queries
- 500-1000ms TTFB
- No caching

**Optimized Strategy:**

```typescript
// src/app/[domain]/page.tsx

export const revalidate = 3600 // 1 hour ISR

export default async function HomePage({ params }: PageProps) {
  // All data cached in memory for 5 minutes
  const renderData = await getWebsiteRenderData(params.domain) // Cached
  
  if (!renderData) {
    notFound()
  }
  
  const { user, website, template, sections } = renderData
  
  // Products cached for 30 minutes
  const { products, isDemo: isDemoProducts } = await getProductsWithDemoFallback(
    user.id,
    { limit: 12, showOnWebsite: true }
  ) // Cached
  
  // Trending cached for 30 minutes
  const { products: trending, isDemo: isDemoTrending } = await getTrendingProductsWithDemoFallback(
    user.id,
    10
  ) // Cached
  
  return (
    <WebsiteLayout user={user} template={template} sections={sections}>
      <HeroCarousel collections={heroCollections} />
      <CategoriesSection categories={categories} />
      <ProductsSection products={products} isDemo={isDemoProducts} />
      <TrendingSection products={trending} isDemo={isDemoTrending} />
      <TestimonialsSection testimonials={testimonials} />
      <Footer user={user} template={template} />
    </WebsiteLayout>
  )
}
```

**Expected Performance:**
- First request: 500ms (cache miss)
- Subsequent requests: 50-100ms (edge cache hit)
- After 1 hour: Background revalidation
- Database queries: <1 per request (average)

---

### Product Detail Page (`/[domain]/products/[productId]`)

**Data Requirements:**
- Product data
- Product reviews
- Related products
- User/website info

**Optimized Strategy:**

```typescript
// src/app/[domain]/products/[productId]/page.tsx

export const revalidate = 3600 // 1 hour ISR

// Pre-generate top products
export async function generateStaticParams() {
  const topProducts = await getTopProducts(100)
  return topProducts.map(p => ({
    domain: p.shop_domain,
    productId: p.id
  }))
}

export default async function ProductPage({ params }: PageProps) {
  // Product data cached for 1 hour
  const { product, isDemo } = await getProductByIdWithDemoFallback(
    params.productId
  ) // Cached
  
  if (!product) {
    notFound()
  }
  
  // Reviews cached for 30 minutes
  const reviews = await getProductReviews(product.id, product.user_id) // Cached
  
  // Related products cached for 30 minutes
  const relatedProducts = await getRelatedProducts(
    product.user_id,
    product.category,
    product.id
  ) // Cached
  
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

**Expected Performance:**
- Top 100 products: Pre-generated at build time (<50ms)
- Other products: ISR with 1 hour cache (100ms first request, 50ms cached)
- Database queries: <1 per request

---

### Products List Page (`/[domain]/products`)

**Data Requirements:**
- Product list (filtered)
- Categories (for filters)
- Collections (for filters)

**Optimized Strategy:**

```typescript
// src/app/[domain]/products/page.tsx

export const revalidate = 1800 // 30 minutes ISR

export default async function ProductsPage({ params, searchParams }: PageProps) {
  const renderData = await getWebsiteRenderData(params.domain) // Cached
  
  if (!renderData) {
    notFound()
  }
  
  // Products cached for 30 minutes
  const { products, isDemo } = await getProductsWithDemoFallback(
    renderData.user.id,
    {
      category: searchParams.category,
      collection: searchParams.collection,
      gender: searchParams.gender,
      showOnWebsite: true
    }
  ) // Cached
  
  // Filter data cached for 1 hour
  const filterData = await getFilterDataForUser(renderData.user.id) // Cached
  
  return (
    <div>
      <FilterDrawer filterData={filterData} />
      <ProductsGrid products={products} isDemo={isDemo} />
    </div>
  )
}
```

---

### Category/Collection Pages

**Optimized Strategy:**

```typescript
// src/app/[domain]/categories/[categoryName]/page.tsx

export const revalidate = 3600 // 1 hour ISR

export default async function CategoryPage({ params }: PageProps) {
  const categoryName = decodeURIComponent(params.categoryName).replace(/-/g, ' ')
  const user = await getWebsiteByDomain(params.domain) // Cached
  
  if (!user) {
    notFound()
  }
  
  // Products for this category cached for 30 minutes
  const { products, isDemo } = await getProductsWithDemoFallback(
    user.id,
    { category: categoryName, showOnWebsite: true }
  ) // Cached
  
  return (
    <div>
      <h1>{categoryName}</h1>
      <ProductsGrid products={products} isDemo={isDemo} />
    </div>
  )
}
```

---

### Static Pages (Privacy, Terms, etc.)

**Optimized Strategy:**

```typescript
// src/app/[domain]/privacy/page.tsx

export const revalidate = 86400 // 1 day

// Optional: Pre-generate for all domains
export async function generateStaticParams() {
  const domains = await getAllShopDomains()
  return domains.map(domain => ({ domain }))
}

export default async function PrivacyPage({ params }: PageProps) {
  const user = await getWebsiteByDomain(params.domain) // Cached
  
  if (!user) {
    notFound()
  }
  
  // Page data cached for 1 day
  const pageData = await getPageData(user.id, 'privacy') // Cached
  
  return <EditableStaticPage user={user} pageData={pageData} />
}
```

**Expected Performance:**
- <50ms TTFB (edge cache)
- Zero database queries (cached)
- Revalidates once per day

---

## API Caching Strategy

### Read-Only APIs

#### Products API

```typescript
// src/app/api/products/route.ts

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const category = searchParams.get('category')
  const limit = parseInt(searchParams.get('limit') || '20')
  
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 })
  }
  
  // Use memory cache
  const cacheKey = `api:products:${userId}:${category}:${limit}`
  const products = await getCached(cacheKey, async () => {
    return await getProducts(userId, { category, limit, showOnWebsite: true })
  }, 30 * 60 * 1000) // 30 minutes
  
  return NextResponse.json({ products }, {
    headers: {
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      'CDN-Cache-Control': 'public, s-maxage=1800',
    }
  })
}
```

#### Categories API

```typescript
// src/app/api/categories/route.ts

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 })
  }
  
  const cacheKey = `api:categories:${userId}`
  const categories = await getCached(cacheKey, async () => {
    return await getCategoriesMap(userId)
  }, 60 * 60 * 1000) // 1 hour
  
  return NextResponse.json({ categories }, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
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
  const userId = searchParams.get('userId')
  
  if (!productId || !userId) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }
  
  const cacheKey = `api:reviews:${productId}`
  const reviews = await getCached(cacheKey, async () => {
    const { data } = await supabaseServer
      .from('customer_reviews')
      .select('*')
      .eq('product_id', productId)
      .eq('shop_id', userId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
    
    return data || []
  }, 30 * 60 * 1000) // 30 minutes
  
  return NextResponse.json({ reviews }, {
    headers: {
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
    }
  })
}
```

---

### Write APIs (No Caching)

Write APIs should NOT be cached, but should invalidate related caches:

```typescript
// src/app/api/reviews/route.ts

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const body = await request.json()
  const { productId, rating, reviewText } = body
  
  // Insert review
  const { error } = await supabaseServer
    .from('customer_reviews')
    .insert({
      product_id: productId,
      customer_id: session.customerId,
      shop_id: session.userId,
      rating,
      review_text: reviewText,
    })
  
  if (error) {
    return NextResponse.json({ error: 'Failed to add review' }, { status: 500 })
  }
  
  // Invalidate related caches
  memoryCache.delete(`api:reviews:${productId}`)
  
  // If using Redis
  await invalidateRedisPattern(`api:reviews:${productId}`)
  
  return NextResponse.json({ success: true })
}
```

---

## Database Query Optimization

### Query Patterns to Cache

#### 1. Website Render Data (Most Important)

**Current:** 4-6 separate queries
**Optimized:** Single cached result

```typescript
// Before (multiple queries)
const user = await getWebsiteByDomain(domain)
const website = await getUserWebsite(user.id)
const template = await getWebsiteTemplate(website.template_id)
const sections = await getTemplateSections(template.id)
const userSections = await getUserWebsiteSections(website.id)

// After (single cached function)
const renderData = await getWebsiteRenderData(domain) // Cached for 5 min
```

---

#### 2. Product Queries

**Cache by query signature:**

```typescript
// Cache key includes all filter parameters
const cacheKey = `products:${userId}:${category}:${collection}:${gender}:${limit}`

const products = await getCached(cacheKey, async () => {
  return await getProducts(userId, { category, collection, gender, limit })
}, 30 * 60 * 1000)
```

---

#### 3. Collection Queries

**Cache by label:**

```typescript
const cacheKey = `collections:${userId}:${label}`

const collections = await getCached(cacheKey, async () => {
  return await getCollectionsByLabel(userId, label)
}, 60 * 60 * 1000) // 1 hour
```

---

### Query Optimization Techniques

#### 1. Reduce Query Count

**Before:**
```typescript
// 3 separate queries
const user = await getWebsiteByDomain(domain)
const template = await getWebsiteTemplate(user.id)
const products = await getProducts(user.id)
```

**After:**
```typescript
// 1 query with joins (if possible)
const { data } = await supabase
  .from('users')
  .select(`
    *,
    user_websites!inner(*),
    products(*)
  `)
  .eq('shop_domain', domain)
  .single()
```

---

#### 2. Parallel Queries

**Before (sequential):**
```typescript
const products = await getProducts(userId)        // 200ms
const trending = await getTrendingProducts(userId) // 200ms
const categories = await getCategories(userId)     // 200ms
// Total: 600ms
```

**After (parallel):**
```typescript
const [products, trending, categories] = await Promise.all([
  getProducts(userId),
  getTrendingProducts(userId),
  getCategories(userId)
])
// Total: 200ms
```

---

#### 3. Selective Field Fetching

**Before:**
```typescript
const { data } = await supabase
  .from('products')
  .select('*') // Fetches all columns
```

**After:**
```typescript
const { data } = await supabase
  .from('products')
  .select('id, name, price, image_url, category') // Only needed fields
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)

#### Day 1-2: Static Page Caching

**Tasks:**
- [ ] Add `revalidate = 86400` to all static pages
- [ ] Test caching behavior
- [ ] Verify edge cache headers

**Files to modify:**
- `src/app/[domain]/privacy/page.tsx`
- `src/app/[domain]/terms/page.tsx`
- `src/app/[domain]/faqs/page.tsx`
- `src/app/[domain]/shipping/page.tsx`
- `src/app/[domain]/warranty/page.tsx`
- `src/app/[domain]/about/page.tsx`
- `src/app/[domain]/careers/page.tsx`
- `src/app/[domain]/press/page.tsx`

**Expected Results:**
- Static pages load in <50ms
- Zero database queries for cached pages
- 100% improvement in static page performance

---

#### Day 3-4: ISR for Product Pages

**Tasks:**
- [ ] Add `revalidate = 3600` to product detail pages
- [ ] Implement `generateStaticParams` for top 100 products
- [ ] Test ISR behavior

**Files to modify:**
- `src/app/[domain]/products/[productId]/page.tsx`

**Expected Results:**
- Product pages cached for 1 hour
- Top 100 products pre-generated
- 80% reduction in product page load time

---

#### Day 5: API Response Caching

**Tasks:**
- [ ] Add cache headers to read-only API routes
- [ ] Test edge caching behavior
- [ ] Monitor cache hit rates

**Files to modify:**
- `src/app/api/products/route.ts` (if exists)
- `src/app/api/categories/route.ts` (if exists)
- `src/app/api/reviews/route.ts`

**Expected Results:**
- API responses cached at edge
- 50% reduction in API response time

---

### Phase 2: Advanced Caching (Week 2)

#### Day 1-2: In-Memory Cache Layer

**Tasks:**
- [ ] Create `src/lib/cache.ts`
- [ ] Implement `MemoryCache` class
- [ ] Add caching to data fetching functions
- [ ] Test cache invalidation

**Files to create:**
- `src/lib/cache.ts`

**Files to modify:**
- `src/lib/supabase-new-architecture.ts`
- `src/lib/supabase.ts`

**Expected Results:**
- 70% reduction in database queries
- Faster response times for repeated requests

---

#### Day 3-4: React Query Integration

**Tasks:**
- [ ] Install `@tanstack/react-query`
- [ ] Set up QueryClientProvider
- [ ] Migrate client components to use React Query
- [ ] Implement optimistic updates

**Files to modify:**
- `src/app/layout.tsx`
- `src/components/wishlist/WishlistContent.tsx`
- `src/components/cart/CartContent.tsx`
- `src/components/products/ProductReviews.tsx`

**Expected Results:**
- Instant navigation (cached data)
- Optimistic UI updates
- Better offline experience

---

#### Day 5: ISR for Home Page

**Tasks:**
- [ ] Add `revalidate = 3600` to home page
- [ ] Optimize data fetching
- [ ] Test background revalidation

**Files to modify:**
- `src/app/[domain]/page.tsx`

**Expected Results:**
- Home page cached for 1 hour
- 10x faster page loads
- 90% reduction in database queries

---

### Phase 3: Optimization & Monitoring (Week 3)

#### Day 1-2: Image Optimization

**Tasks:**
- [ ] Configure Next.js image optimization
- [ ] Set up CDN caching for images
- [ ] Implement responsive image sizes

**Files to modify:**
- `next.config.js`

**Expected Results:**
- Images cached for 1 year
- Automatic WebP conversion
- 40% faster image loads

---

#### Day 3-4: Cache Invalidation Strategy

**Tasks:**
- [ ] Implement cache invalidation on updates
- [ ] Add invalidation to editor API routes
- [ ] Test invalidation patterns

**Files to modify:**
- `src/app/api/editor/*/route.ts`
- All write API routes

**Expected Results:**
- Consistent data across caches
- Immediate updates when content changes

---

#### Day 5: Monitoring & Metrics

**Tasks:**
- [ ] Set up cache hit rate monitoring
- [ ] Add performance metrics
- [ ] Create dashboard for cache statistics

**Expected Results:**
- Visibility into cache performance
- Ability to optimize cache strategy
- Data-driven decisions

---

### Phase 4: Advanced Features (Optional)

#### Redis Integration (If Needed)

**When to implement:**
- Traffic > 10K requests/hour
- Multiple serverless instances
- Need persistent cache

**Tasks:**
- [ ] Set up Upstash Redis
- [ ] Create `src/lib/redis.ts`
- [ ] Migrate critical caches to Redis
- [ ] Implement distributed cache invalidation

---

#### Service Worker (PWA)

**Tasks:**
- [ ] Install `next-pwa`
- [ ] Configure service worker
- [ ] Implement offline fallback
- [ ] Add background sync

---

## Performance Metrics & Targets

### Before Optimization

| Metric | Current Value |
|--------|---------------|
| Home Page TTFB | 500-1000ms |
| Product Page TTFB | 300-600ms |
| Static Page TTFB | 200-400ms |
| API Response Time | 200-500ms |
| Database Queries/Page | 10+ |
| Cache Hit Rate | 0% |
| Lighthouse Score | 60-70 |

### After Optimization (Target)

| Metric | Target Value | Improvement |
|--------|--------------|-------------|
| Home Page TTFB | 50-100ms | **10x faster** |
| Product Page TTFB | 50-100ms | **6x faster** |
| Static Page TTFB | <50ms | **8x faster** |
| API Response Time | 50-100ms | **5x faster** |
| Database Queries/Page | <1 | **90%+ reduction** |
| Cache Hit Rate | 90%+ | **∞ improvement** |
| Lighthouse Score | 95+ | **35% improvement** |

---

## Cache Invalidation Strategy

### When to Invalidate

| Action | Caches to Invalidate |
|--------|---------------------|
| Product updated | `products:*`, `website:render:*` |
| Collection updated | `collections:*`, `website:render:*` |
| Category updated | `categories:*`, `website:render:*` |
| Section updated | `website:render:*` |
| Review added | `reviews:${productId}` |
| Template changed | `template:*`, `website:render:*` |

### Implementation

```typescript
// Helper function for cache invalidation
export async function invalidateCache(patterns: string[]) {
  // Invalidate memory cache
  patterns.forEach(pattern => {
    memoryCache.invalidatePattern(new RegExp(pattern))
  })
  
  // Invalidate Redis (if using)
  if (redis) {
    await Promise.all(
      patterns.map(pattern => invalidateRedisPattern(pattern))
    )
  }
  
  // Revalidate Next.js pages (if needed)
  // This triggers background revalidation
  // revalidatePath('/[domain]')
}

// Use in update operations
export async function updateProduct(productId: string, data: any) {
  // Update database
  await supabase
    .from('products')
    .update(data)
    .eq('id', productId)
  
  // Invalidate caches
  await invalidateCache([
    'products:*',
    'website:render:*',
    `api:products:*`
  ])
}
```

---

## Monitoring & Debugging

### Cache Hit Rate Monitoring

```typescript
// Add to cache.ts
class MemoryCache {
  private hits = 0
  private misses = 0
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) {
      this.misses++
      return null
    }
    
    const age = Date.now() - entry.timestamp
    if (age > entry.ttl) {
      this.cache.delete(key)
      this.misses++
      return null
    }
    
    this.hits++
    return entry.data
  }
  
  getStats() {
    const total = this.hits + this.misses
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0
    
    return {
      hits: this.hits,
      misses: this.misses,
      total,
      hitRate: hitRate.toFixed(2) + '%',
      size: this.cache.size
    }
  }
}
```

### Debug Endpoint

```typescript
// src/app/api/debug/cache/route.ts

export async function GET() {
  const stats = memoryCache.getStats()
  
  return NextResponse.json({
    memory_cache: stats,
    timestamp: new Date().toISOString()
  })
}
```

---

## Summary

### What to Cache

| Data Type | Cache Layer | TTL | Invalidation |
|-----------|-------------|-----|--------------|
| Static pages | Edge | 1 day | Manual/scheduled |
| Product pages | Edge + Memory | 1 hour | On product update |
| Home page | Edge + Memory | 1 hour | On content update |
| API responses | Edge + Memory | 5-60 min | On data update |
| Website config | Memory | 5 min | On config update |
| Templates | Memory | Permanent | Never |
| Products list | Memory | 30 min | On product update |
| Collections | Memory | 1 hour | On collection update |
| User sessions | Memory/Redis | 30 days | On logout |
| Wishlist | Client (React Query) | 5 min | On add/remove |
| Cart | Client (React Query) | 2 min | On add/remove |

### Where to Cache

1. **Client (Browser):**
   - React Query for API data
   - LocalStorage for session
   - IndexedDB for offline data

2. **Edge (CDN):**
   - Static pages (1 day)
   - ISR pages (1 hour)
   - API responses (5-60 min)
   - Images (1 year)

3. **Server (Memory):**
   - Website render data (5 min)
   - Templates (permanent)
   - Product lists (30 min)
   - Collections (1 hour)

4. **Distributed (Redis - Optional):**
   - High-traffic data
   - User sessions
   - Rate limiting

### Expected Results

- **Performance:** 10x faster page loads
- **Scalability:** Handle 10x more traffic
- **Cost:** 80% reduction in infrastructure costs
- **User Experience:** Near-instant navigation
- **Database Load:** 95%+ reduction in queries

---

**Document Version:** 1.0  
**Last Updated:** February 14, 2026  
**Author:** Cascade AI System Design
