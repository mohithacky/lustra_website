/**
 * ISR Cache Logger
 * 
 * HOW ISR WORKS (simple explanation):
 * 
 * 1. First visitor hits a page → Server generates it fresh → Saves to cache → Returns page
 * 2. Next visitors → Vercel serves the CACHED version instantly (no server code runs)
 * 3. After revalidate time expires → Next visitor triggers background regeneration
 * 4. Background regeneration runs → Updates cache → Future visitors get new version
 * 
 * HOW TO READ THESE LOGS:
 * 
 * ✅ If you see "🔄 FRESH PAGE GENERATION" in Vercel logs:
 *    → The page was NOT in cache. Server fetched all data from database.
 *    → This happens on first visit, or after cache expires.
 * 
 * ✅ If you DON'T see any log for a page request:
 *    → The page WAS served from cache! ISR is working! 🎉
 *    → Vercel returned the cached HTML without running any server code.
 * 
 * You can also check the response header "X-Vercel-Cache":
 *    → HIT = served from cache (ISR working!)
 *    → MISS = freshly generated (first time or cache expired)
 *    → STALE = serving old cache while regenerating in background
 */

export function logISRPageGeneration(pageName: string, domain: string, revalidateSeconds: number, extras?: Record<string, string>) {
  const cacheHours = revalidateSeconds >= 3600 ? `${revalidateSeconds / 3600}h` : `${revalidateSeconds}s`
  const nextRevalidation = new Date(Date.now() + revalidateSeconds * 1000).toISOString()
  
  const extraInfo = extras ? Object.entries(extras).map(([k, v]) => `${k}=${v}`).join(' | ') : ''
  
  console.log(`\n${'🔄'.repeat(3)} FRESH PAGE GENERATION (NOT from cache) ${'🔄'.repeat(3)}`)
  console.log(`┌─────────────────────────────────────────────────────────────`)
  console.log(`│ Page:        ${pageName}`)
  console.log(`│ Domain:      ${domain}`)
  console.log(`│ Time:        ${new Date().toISOString()}`)
  console.log(`│ Cache TTL:   ${cacheHours} (revalidate=${revalidateSeconds}s)`)
  console.log(`│ Next Regen:  ${nextRevalidation}`)
  if (extraInfo) {
    console.log(`│ Details:     ${extraInfo}`)
  }
  console.log(`│`)
  console.log(`│ 👉 If you see this log, the page was FRESHLY GENERATED.`)
  console.log(`│ 👉 If you DON'T see this log, the page was SERVED FROM CACHE.`)
  console.log(`│ 👉 Check response header "X-Vercel-Cache: HIT" to confirm cache.`)
  console.log(`└─────────────────────────────────────────────────────────────\n`)
}

export function logISRPageComplete(pageName: string, domain: string, totalTimeMs: number) {
  console.log(`\n✅ ${pageName} | ${domain} | Generated in ${totalTimeMs}ms | Now cached at Vercel Edge\n`)
}
