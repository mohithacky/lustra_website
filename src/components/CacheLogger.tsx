'use client'

import { useEffect } from 'react'

interface CacheLoggerProps {
  pageName: string
  domain: string
  additionalData?: Record<string, any>
}

/**
 * Client-side cache performance logger
 * Logs page load performance and cache status to browser console
 */
export function CacheLogger({ pageName, domain, additionalData = {} }: CacheLoggerProps) {
  useEffect(() => {
    // Wait for page to fully load
    if (typeof window === 'undefined') return

    const logPerformance = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      if (!navigation) return

      const metrics = {
        // Core Web Vitals
        ttfb: Math.round(navigation.responseStart - navigation.requestStart),
        domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart),
        loadComplete: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
        
        // Detailed timing
        dns: Math.round(navigation.domainLookupEnd - navigation.domainLookupStart),
        tcp: Math.round(navigation.connectEnd - navigation.connectStart),
        request: Math.round(navigation.responseStart - navigation.requestStart),
        response: Math.round(navigation.responseEnd - navigation.responseStart),
        domProcessing: Math.round(navigation.domComplete - navigation.domLoading),
        
        // Total time
        totalTime: Math.round(navigation.loadEventEnd - navigation.fetchStart),
      }

      // Check if page was served from cache
      const isCached = navigation.transferSize === 0 || navigation.transferSize < 1000
      const cacheStatus = isCached ? '✅ CACHE HIT' : '⚠️ CACHE MISS (First Load)'

      console.log('\n' + '🎯'.repeat(40))
      console.log(`[CLIENT] 📊 PERFORMANCE METRICS: ${pageName}`)
      console.log('🎯'.repeat(40))
      console.log(`[CLIENT] Domain: ${domain}`)
      console.log(`[CLIENT] Page: ${pageName}`)
      console.log(`[CLIENT] Timestamp: ${new Date().toISOString()}`)
      console.log(`[CLIENT] Cache Status: ${cacheStatus}`)
      console.log('')
      console.log(`[CLIENT] ⚡ Core Metrics:`)
      console.log(`[CLIENT]   - TTFB (Time to First Byte): ${metrics.ttfb}ms`)
      console.log(`[CLIENT]   - DOM Content Loaded: ${metrics.domContentLoaded}ms`)
      console.log(`[CLIENT]   - Page Load Complete: ${metrics.loadComplete}ms`)
      console.log(`[CLIENT]   - Total Time: ${metrics.totalTime}ms`)
      console.log('')
      console.log(`[CLIENT] 🔍 Detailed Timing:`)
      console.log(`[CLIENT]   - DNS Lookup: ${metrics.dns}ms`)
      console.log(`[CLIENT]   - TCP Connection: ${metrics.tcp}ms`)
      console.log(`[CLIENT]   - Request Time: ${metrics.request}ms`)
      console.log(`[CLIENT]   - Response Time: ${metrics.response}ms`)
      console.log(`[CLIENT]   - DOM Processing: ${metrics.domProcessing}ms`)
      console.log('')
      console.log(`[CLIENT] 📦 Transfer Info:`)
      console.log(`[CLIENT]   - Transfer Size: ${navigation.transferSize} bytes`)
      console.log(`[CLIENT]   - Encoded Body Size: ${navigation.encodedBodySize} bytes`)
      console.log(`[CLIENT]   - Decoded Body Size: ${navigation.decodedBodySize} bytes`)
      
      if (Object.keys(additionalData).length > 0) {
        console.log('')
        console.log(`[CLIENT] 📋 Additional Data:`)
        Object.entries(additionalData).forEach(([key, value]) => {
          console.log(`[CLIENT]   - ${key}: ${value}`)
        })
      }
      
      console.log('')
      console.log(`[CLIENT] 💡 Performance Analysis:`)
      
      if (metrics.ttfb < 100) {
        console.log(`[CLIENT]   ✅ EXCELLENT: TTFB < 100ms (likely served from edge cache)`)
      } else if (metrics.ttfb < 300) {
        console.log(`[CLIENT]   ✅ GOOD: TTFB < 300ms`)
      } else if (metrics.ttfb < 600) {
        console.log(`[CLIENT]   ⚠️ FAIR: TTFB < 600ms (consider optimization)`)
      } else {
        console.log(`[CLIENT]   ❌ SLOW: TTFB > 600ms (needs optimization)`)
      }
      
      if (isCached) {
        console.log(`[CLIENT]   ✅ Page served from cache (fast delivery)`)
      } else {
        console.log(`[CLIENT]   ⚠️ First load - subsequent loads will be faster`)
      }
      
      console.log('🎯'.repeat(40) + '\n')
      
      // Also log to window for easy debugging
      if (typeof window !== 'undefined') {
        (window as any).__CACHE_METRICS__ = {
          pageName,
          domain,
          metrics,
          isCached,
          timestamp: new Date().toISOString(),
          ...additionalData,
        }
        console.log('[CLIENT] 💾 Metrics saved to window.__CACHE_METRICS__')
      }
    }

    // Log immediately if page is already loaded
    if (document.readyState === 'complete') {
      setTimeout(logPerformance, 100)
    } else {
      // Wait for page to load
      window.addEventListener('load', () => {
        setTimeout(logPerformance, 100)
      })
    }
  }, [pageName, domain, additionalData])

  return null // This component doesn't render anything
}

/**
 * Helper function to log cache events from anywhere in the app
 */
export function logCacheEvent(eventName: string, data: Record<string, any> = {}) {
  console.log(`\n[CACHE EVENT] ${eventName}`)
  console.log(`[CACHE EVENT] Timestamp: ${new Date().toISOString()}`)
  Object.entries(data).forEach(([key, value]) => {
    console.log(`[CACHE EVENT] ${key}: ${value}`)
  })
  console.log('')
}
