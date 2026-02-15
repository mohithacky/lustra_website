# ISR Cache Logging Guide

**Purpose:** Monitor and verify ISR caching behavior in production  
**Implementation Date:** February 15, 2026

---

## Overview

Comprehensive logging has been added to track ISR cache performance across:
- ✅ Server-side (Vercel Functions)
- ✅ Client-side (Browser Console)
- ✅ API Routes (Edge Caching)

---

## Server-Side Logs (Vercel Functions)

### Where to View
**Vercel Dashboard → Your Project → Functions → Logs**

### Log Format

#### Home Page Request
```
================================================================================
[ISR] 🏠 HOME PAGE REQUEST
[ISR] Domain: abcjewellers
[ISR] Timestamp: 2026-02-15T01:30:00.000Z
[ISR] Cache Config: revalidate = 3600s (1 hour)
================================================================================
[ISR] 🔍 Fetching website render data for: abcjewellers
[ISR] ✅ Render data fetched in 245ms
[ISR] 📊 Render Data Summary:
[ISR]   - User ID: abc-123-xyz
[ISR]   - Shop Name: ABC Jewellers
[ISR]   - Website ID: website-456
[ISR]   - Template: Classic Jewelry
[ISR]   - Sections: 12
[ISR] 🎨 Processing sections and collections...
[ISR] 📦 Data Fetched:
[ISR]   - Products: 24 (demo: false)
[ISR]   - Testimonials: 5
[ISR]   - Trending products: 10 (demo: false)
[ISR]   - Announcements: 2 (enabled: true)
[ISR]   - Gold rate: found (enabled: true)

================================================================================
[ISR] ✅ HOME PAGE GENERATION COMPLETE
[ISR] Total Time: 487ms
[ISR] Domain: abcjewellers
[ISR] Cache Key: /abcjewellers
[ISR] Next Revalidation: 2026-02-15T02:30:00.000Z
[ISR] 💡 This page will be cached at Vercel Edge for 1 hour
[ISR] 💡 Subsequent requests will be served in ~50ms from cache
================================================================================
```

#### Product Detail Page Request
```
================================================================================
[ISR] 🛍️ PRODUCT DETAIL PAGE REQUEST
[ISR] Domain: abcjewellers
[ISR] Product ID: prod-789
[ISR] Timestamp: 2026-02-15T01:30:00.000Z
[ISR] Cache Config: revalidate = 3600s (1 hour)
================================================================================
[ISR] 🔍 Fetching website render data...
[ISR] ✅ Render data fetched in 156ms
[ISR] 📊 Website Data:
[ISR]   - User ID: abc-123-xyz
[ISR]   - Shop Name: ABC Jewellers
[ISR]   - Website ID: website-456
[ISR] 📦 Product Data:
[ISR]   - Product Name: Gold Necklace
[ISR]   - Product ID: prod-789
[ISR]   - Is Demo: false
[ISR]   - Related Products: 4

================================================================================
[ISR] ✅ PRODUCT PAGE GENERATION COMPLETE
[ISR] Total Time: 312ms
[ISR] Cache Key: /abcjewellers/products/prod-789
[ISR] Next Revalidation: 2026-02-15T02:30:00.000Z
[ISR] 💡 This page will be cached at Vercel Edge for 1 hour
================================================================================
```

#### Static Page Request
```
================================================================================
[ISR] 📄 STATIC PAGE REQUEST: Privacy Policy
[ISR] Domain: abcjewellers
[ISR] Cache Config: revalidate = 86400s (24 hours)
================================================================================
[ISR] ✅ User found: ABC Jewellers (abc-123-xyz)
[ISR] ✅ Privacy page generated in 123ms
[ISR] Cache Key: /abcjewellers/privacy
[ISR] 💡 Cached for 24 hours at edge
================================================================================
```

#### API Route Request
```
------------------------------------------------------------
[API CACHE] 💬 Reviews API Request
[API CACHE] Timestamp: 2026-02-15T01:30:00.000Z
[API CACHE] Cache: 30 min edge, 1 hour stale-while-revalidate
------------------------------------------------------------
[API CACHE] Product ID: prod-789
[API CACHE] User ID: abc-123-xyz
[API CACHE] ✅ Found 12 reviews in 89ms
[API CACHE] 💡 Response will be cached at edge for 30 minutes
------------------------------------------------------------
```

---

## Client-Side Logs (Browser Console)

### Where to View
**Browser DevTools → Console Tab**

### Automatic Performance Logging

The `CacheLogger` component automatically logs performance metrics when added to a page:

```typescript
import { CacheLogger } from '@/components/CacheLogger'

// Add to any page component
<CacheLogger 
  pageName="Home Page" 
  domain={params.domain}
  additionalData={{ userId: user.id }}
/>
```

### Log Output Example

```
🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯
[CLIENT] 📊 PERFORMANCE METRICS: Home Page
🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯
[CLIENT] Domain: abcjewellers
[CLIENT] Page: Home Page
[CLIENT] Timestamp: 2026-02-15T01:30:00.000Z
[CLIENT] Cache Status: ✅ CACHE HIT

[CLIENT] ⚡ Core Metrics:
[CLIENT]   - TTFB (Time to First Byte): 52ms
[CLIENT]   - DOM Content Loaded: 234ms
[CLIENT]   - Page Load Complete: 456ms
[CLIENT]   - Total Time: 512ms

[CLIENT] 🔍 Detailed Timing:
[CLIENT]   - DNS Lookup: 2ms
[CLIENT]   - TCP Connection: 8ms
[CLIENT]   - Request Time: 52ms
[CLIENT]   - Response Time: 145ms
[CLIENT]   - DOM Processing: 234ms

[CLIENT] 📦 Transfer Info:
[CLIENT]   - Transfer Size: 0 bytes
[CLIENT]   - Encoded Body Size: 45678 bytes
[CLIENT]   - Decoded Body Size: 123456 bytes

[CLIENT] 📋 Additional Data:
[CLIENT]   - userId: abc-123-xyz

[CLIENT] 💡 Performance Analysis:
[CLIENT]   ✅ EXCELLENT: TTFB < 100ms (likely served from edge cache)
[CLIENT]   ✅ Page served from cache (fast delivery)
🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯

[CLIENT] 💾 Metrics saved to window.__CACHE_METRICS__
```

### Access Metrics Programmatically

```javascript
// In browser console
console.log(window.__CACHE_METRICS__)

// Output:
{
  pageName: "Home Page",
  domain: "abcjewellers",
  metrics: {
    ttfb: 52,
    domContentLoaded: 234,
    loadComplete: 456,
    totalTime: 512,
    // ... more metrics
  },
  isCached: true,
  timestamp: "2026-02-15T01:30:00.000Z",
  userId: "abc-123-xyz"
}
```

---

## Understanding the Logs

### First Request (Cache Miss)

**Server Logs:**
```
[ISR] Total Time: 487ms  ← Slow (generating page)
[ISR] 💡 This page will be cached at Vercel Edge for 1 hour
```

**Client Logs:**
```
[CLIENT] Cache Status: ⚠️ CACHE MISS (First Load)
[CLIENT] TTFB: 487ms  ← Slow (first generation)
[CLIENT]   ⚠️ First load - subsequent loads will be faster
```

**What's Happening:**
1. Page doesn't exist in cache
2. Vercel generates page (queries database, processes data)
3. Page is cached at edge
4. User receives generated page

---

### Second Request (Cache Hit)

**Server Logs:**
```
No logs! (Page served from edge, doesn't hit your function)
```

**Client Logs:**
```
[CLIENT] Cache Status: ✅ CACHE HIT
[CLIENT] TTFB: 52ms  ← Fast! (served from cache)
[CLIENT]   ✅ EXCELLENT: TTFB < 100ms (likely served from edge cache)
[CLIENT]   ✅ Page served from cache (fast delivery)
```

**What's Happening:**
1. Page exists in edge cache
2. Vercel Edge returns cached page immediately
3. No database queries
4. 10x faster delivery

---

### After Revalidation Time (Stale-While-Revalidate)

**First Request After 1 Hour:**

**Server Logs:**
```
[ISR] Total Time: 456ms  ← Regenerating in background
```

**Client Logs:**
```
[CLIENT] Cache Status: ✅ CACHE HIT
[CLIENT] TTFB: 55ms  ← Still fast! (stale cache served)
[CLIENT]   ✅ EXCELLENT: TTFB < 100ms
```

**What's Happening:**
1. Cache is stale (> 1 hour old)
2. User gets stale cache immediately (fast)
3. Background: Page regenerates
4. Next user gets fresh cache

---

## Monitoring Cache Performance

### Key Metrics to Watch

#### TTFB (Time to First Byte)
- **< 100ms:** ✅ Excellent (edge cache hit)
- **100-300ms:** ✅ Good (possible cache hit)
- **300-600ms:** ⚠️ Fair (cache miss or slow generation)
- **> 600ms:** ❌ Slow (needs optimization)

#### Cache Hit Rate
- **Goal:** 90%+ cache hit rate
- **How to check:** Compare requests with/without server logs
- **Server logs = cache miss**
- **No server logs = cache hit**

#### Generation Time
- **Home Page:** Should be < 500ms
- **Product Page:** Should be < 300ms
- **Static Page:** Should be < 200ms

---

## Verifying ISR is Working

### Test 1: First Load (Cache Miss)

```bash
# Visit page for first time
curl -I https://abcjewellers.lustrai.in

# Check headers:
X-Vercel-Cache: MISS  ← First generation
Age: 0  ← Fresh cache
```

**Expected Server Logs:**
```
[ISR] 🏠 HOME PAGE REQUEST
[ISR] Total Time: 487ms
```

---

### Test 2: Second Load (Cache Hit)

```bash
# Visit same page again
curl -I https://abcjewellers.lustrai.in

# Check headers:
X-Vercel-Cache: HIT  ← Served from cache
Age: 15  ← Cache is 15 seconds old
```

**Expected Server Logs:**
```
(No logs - page served from edge)
```

---

### Test 3: Different Subdomain (Separate Cache)

```bash
# Visit different subdomain
curl -I https://xyzjewellers.lustrai.in

# Check headers:
X-Vercel-Cache: MISS  ← New subdomain, new cache
Age: 0
```

**Expected Server Logs:**
```
[ISR] 🏠 HOME PAGE REQUEST
[ISR] Domain: xyzjewellers  ← Different domain
[ISR] Total Time: 502ms
```

---

## Debugging Cache Issues

### Issue: Pages Always Show CACHE MISS

**Possible Causes:**
1. `revalidate` not set correctly
2. `dynamic = 'force-dynamic'` still present
3. Cookies causing cache bypass

**Check:**
```typescript
// Verify in page file:
export const revalidate = 3600  // Should be present
// export const dynamic = 'force-dynamic'  // Should NOT be present
```

---

### Issue: Slow TTFB Even on Cache Hit

**Possible Causes:**
1. Large page size
2. Slow network
3. Not actually hitting cache

**Check:**
```bash
curl -I https://yourdomain.lustrai.in
# Look for: X-Vercel-Cache: HIT
```

---

### Issue: Cache Not Invalidating

**Solution:** Manual revalidation
```typescript
import { revalidatePath } from 'next/cache'

// In your API route after update:
revalidatePath('/[domain]')
revalidatePath('/[domain]/products/[productId]')
```

---

## Log Locations

### Production (Vercel)

**Server Logs:**
1. Go to Vercel Dashboard
2. Select your project
3. Click "Functions" tab
4. View real-time logs

**Client Logs:**
1. Open your website
2. Open Browser DevTools (F12)
3. Go to Console tab
4. Logs appear automatically

---

### Development (Local)

**Server Logs:**
```bash
npm run dev
# Logs appear in terminal
```

**Client Logs:**
```
Open http://localhost:3000
Open Browser DevTools → Console
```

---

## Performance Benchmarks

### Expected Performance After ISR

| Page Type | First Load (MISS) | Cached Load (HIT) | Improvement |
|-----------|-------------------|-------------------|-------------|
| Home Page | 400-600ms | 50-100ms | **8x faster** |
| Product Page | 300-500ms | 50-100ms | **6x faster** |
| Static Page | 200-400ms | <50ms | **8x faster** |
| API Response | 100-300ms | 50-100ms | **3x faster** |

---

## Custom Cache Events

Use the `logCacheEvent` helper for custom logging:

```typescript
import { logCacheEvent } from '@/components/CacheLogger'

// Log custom cache events
logCacheEvent('Product Added to Cart', {
  productId: 'prod-123',
  userId: 'user-456',
  cached: true,
})
```

**Output:**
```
[CACHE EVENT] Product Added to Cart
[CACHE EVENT] Timestamp: 2026-02-15T01:30:00.000Z
[CACHE EVENT] productId: prod-123
[CACHE EVENT] userId: user-456
[CACHE EVENT] cached: true
```

---

## Summary

### ✅ What's Logged

**Server-Side (Vercel Functions):**
- Page generation requests
- Database query times
- Total generation time
- Cache configuration
- Revalidation schedule

**Client-Side (Browser):**
- Page load performance
- Cache hit/miss status
- TTFB and timing metrics
- Performance analysis

**API Routes:**
- Request details
- Response time
- Cache headers
- Data fetched

### 📊 How to Monitor

1. **Vercel Dashboard:** Server-side logs
2. **Browser Console:** Client-side performance
3. **Response Headers:** Cache status
4. **window.__CACHE_METRICS__:** Programmatic access

### 🎯 Success Indicators

- ✅ TTFB < 100ms on cached pages
- ✅ 90%+ cache hit rate
- ✅ No server logs on cached requests
- ✅ `X-Vercel-Cache: HIT` in headers

---

**Document Version:** 1.0  
**Last Updated:** February 15, 2026  
**Status:** Production Ready
