import { Metadata } from 'next'
import { notFound } from 'next/navigation'
// New Architecture imports
import {
  getWebsiteRenderData,
  getHeroCollections as getHeroFromSections,
  getTrendingCollections as getTrendingFromSections,
  getCategoryCollections,
  getBestCollections as getBestFromSections,
  getProductTypeCollections,
  getFooterDataFromPages,
  isTestimonialsEnabled,
  isTestimonialsEnabledLegacy,
  transformHeroToLegacy,
  transformTrendingToLegacy,
  transformCategoriesToMap,
  transformBestToLegacy,
  getSectionConfig,
  getActiveAnnouncements,
  getAnnouncementBarConfig,
  isAnnouncementBarEnabled,
  getGoldRate,
  isGoldRateSectionEnabled,
  Collection,
} from '@/lib/supabase-new-architecture'
// Legacy imports for products (still using old tables)
import { 
  getProductsWithDemoFallback, 
  getTestimonialsWithDemoFallback,
  getTrendingProductsWithDemoFallback,
  getWebsiteByDomain as getWebsiteByDomainLegacy,
  getStoreInfoForUser,
} from '@/lib/supabase'
import WebsiteLayout from '@/components/layout/WebsiteLayout'
import ProductsSection from '@/components/sections/ProductsSection'
import ShopByProductTypeSection from '@/components/sections/ShopByProductTypeSection'
import ShopByRecipientSection from '@/components/sections/ShopByRecipientSection'
import TrendingProductsSection from '@/components/sections/TrendingProductsSection'
import TestimonialsSection from '@/components/sections/TestimonialsSection'
import GoldRateBanner from '@/components/sections/GoldRateBanner'
import SearchBar from '@/components/sections/SearchBar'
import { 
  EditableHeroCarousel, 
  EditableTrendingSection, 
  EditableBestCollections,
  EditableCategories,
  EditableFooter,
} from '@/components/editor/EditableSections'

interface PageProps {
  params: { domain: string }
}

// List of file extensions that should NOT be treated as shop domains
const EXCLUDED_EXTENSIONS = ['.js', '.css', '.json', '.ico', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.map', '.txt', '.xml', '.webmanifest']

function isValidDomain(domain: string): boolean {
  // Exclude file requests
  const lowerDomain = domain.toLowerCase()
  if (EXCLUDED_EXTENSIONS.some(ext => lowerDomain.endsWith(ext))) {
    return false
  }
  // Exclude known system paths
  if (['favicon', 'robots', 'sitemap', '_next', 'api', 'static'].includes(lowerDomain)) {
    return false
  }
  // Domain should be alphanumeric with optional hyphens/underscores
  return /^[a-zA-Z0-9_-]+$/.test(domain)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // Skip metadata generation for invalid domains (static files, etc.)
  if (!isValidDomain(params.domain)) {
    return { title: 'Not Found' }
  }

  const renderData = await getWebsiteRenderData(params.domain)
  
  if (!renderData) {
    return {
      title: 'Store Not Found',
    }
  }

  const { user, website } = renderData
  const metaTitle = website.meta_title || `${user.shop_name || 'Jewelry Store'} - Exquisite Jewelry Collection`
  const metaDescription = website.meta_description || `Discover beautiful jewelry at ${user.shop_name}. Browse our collection of rings, necklaces, earrings, and more.`

  return {
    title: metaTitle,
    description: metaDescription,
    openGraph: {
      title: user.shop_name || 'Jewelry Store',
      description: `Discover beautiful jewelry at ${user.shop_name}`,
      images: user.logo_url ? [user.logo_url] : [],
    },
  }
}

// Enable ISR - revalidate every hour
export const revalidate = 3600 // 1 hour - home page cached at edge

export default async function StorePage({ params }: PageProps) {
  // ============================================================================
  // Validate domain parameter - exclude static file requests
  // ============================================================================
  if (!isValidDomain(params.domain)) {
    console.log(`Skipping invalid domain: ${params.domain}`)
    notFound()
  }

  // ============================================================================
  // NEW ARCHITECTURE: Use the new rendering flow
  // ============================================================================
  const renderData = await getWebsiteRenderData(params.domain)
  
  if (!renderData) {
    notFound()
  }

  const { user, website, template, sections } = renderData

  if (!user || !website || !template || !sections) {
    console.error('[PAGE] Missing required render data')
    notFound()
  }

  // Log render data summary
  console.log(`\n[PAGE] Rendering StorePage for domain: ${params.domain}`)
  console.log(`[PAGE] User: ${user.id} (${user.shop_name})`)
  console.log(`[PAGE] Sections received: ${sections.length}`)

  // Get collections from merged sections
  const heroCollectionsFromSections = getHeroFromSections(sections)
  const trendingCollectionsFromSections = getTrendingFromSections(sections)
  const categoryCollections = getCategoryCollections(sections)
  const bestCollectionsFromSections = getBestFromSections(sections)
  const productTypes = getProductTypeCollections(sections)
  // Check both new architecture and legacy table for testimonials
  const showTestimonialsFromSections = isTestimonialsEnabled(sections)
  const showTestimonialsFromLegacy = await isTestimonialsEnabledLegacy(user.id)
  const showTestimonials = showTestimonialsFromSections || showTestimonialsFromLegacy
  
  // Get section configs (merged schema + user customizations)
  const heroConfig = getSectionConfig(sections, 'hero_carousel')
  const categoriesConfig = getSectionConfig(sections, 'categories')
  const productsConfig = getSectionConfig(sections, 'products')
  const shopByRecipientConfig = getSectionConfig(sections, 'shop_by_recipient')
  const trendingConfig = getSectionConfig(sections, 'trending')
  const trendingProductsConfig = getSectionConfig(sections, 'trending_products')
  const bestCollectionsConfig = getSectionConfig(sections, 'best_collections')
  const testimonialsConfig = getSectionConfig(sections, 'testimonials')
  const shopByProductTypeConfig = getSectionConfig(sections, 'shop_by_product_type')
  
  // Fetch footer data from user_website_pages table
  const footerData = await getFooterDataFromPages(sections, website.id)

  // Transform to legacy format for existing components
  const heroCollections = transformHeroToLegacy(heroCollectionsFromSections)
  const trendingCollections = transformTrendingToLegacy(trendingCollectionsFromSections)
  const categoriesMap = transformCategoriesToMap(categoryCollections)
  const bestCollections = transformBestToLegacy(bestCollectionsFromSections)

  // Log what will be rendered
  console.log(`[PAGE] Data for rendering:`)
  console.log(`  - Hero collections: ${heroCollections.length}`)
  console.log(`  - Categories: ${Object.keys(categoriesMap).length}`)
  console.log(`  - Trending collections: ${trendingCollections.length}`)
  console.log(`  - Best collections: ${bestCollections.length}`)
  console.log(`  - Show testimonials: ${showTestimonials}`)
  console.log(`  - Product types: ${productTypes.length > 0 ? productTypes.map(pt => pt.name).join(', ') : 'none'}`)

  // Fetch announcements and check if enabled
  const announcementBarEnabled = isAnnouncementBarEnabled(sections)
  const announcementBarConfig = getAnnouncementBarConfig(sections)

  // Check if gold rate section is enabled
  const goldRateSectionEnabled = isGoldRateSectionEnabled(sections)

  // Fetch products from products table with demo fallback
  const [productsResult, testimonialsResult, trendingProductsResult, announcements, goldRate, storeInfo] = await Promise.all([
    getProductsWithDemoFallback(user.id, { limit: 12 }),
    getTestimonialsWithDemoFallback(user.id),
    getTrendingProductsWithDemoFallback(user.id, 10),
    announcementBarEnabled ? getActiveAnnouncements(user.id) : Promise.resolve([]),
    goldRateSectionEnabled ? getGoldRate(user.id) : Promise.resolve(null),
    getStoreInfoForUser(user.id),
  ])

  const { products, isDemo: isDemoProducts } = productsResult
  const { testimonials } = testimonialsResult
  const { products: trendingProducts, isDemo: isDemoTrending } = trendingProductsResult

  console.log(`  - Products: ${products.length} (demo: ${isDemoProducts})`)
  console.log(`  - Testimonials: ${testimonials.length}`)
  console.log(`  - Trending products: ${trendingProducts.length} (demo: ${isDemoTrending})`)
  console.log(`  - Announcements: ${announcements.length} (enabled: ${announcementBarEnabled})`)
  console.log(`  - Gold rate: ${goldRate ? 'found' : 'not found'} (enabled: ${goldRateSectionEnabled})`)

  // Transform categories map to array format for components
  const categoriesArray = Object.entries(categoriesMap).map(([name, imageUrl], index) => ({
    id: String(index),
    user_id: user.id,
    name,
    image_url: imageUrl as string,
    description: null,
    display_order: index,
    created_at: '',
    updated_at: '',
  }))

  // Combine ALL collections (hero + trending + best) for the navigation mega menu
  // Deduplicate by name so each collection appears only once
  const allCollections = [
    ...heroCollectionsFromSections,
    ...trendingCollectionsFromSections,
    ...bestCollectionsFromSections,
  ]
  const seenNames = new Set<string>()
  const collectionsArray = allCollections
    .filter((col: Collection) => {
      if (seenNames.has(col.name)) return false
      seenNames.add(col.name)
      return true
    })
    .map((col: Collection, index: number) => ({
      id: col.id,
      user_id: col.user_id,
      name: col.name,
      banner_url: (col.image_url || '') as string,
      description: null as string | null,
      display_order: index,
      created_at: col.created_at || '',
      updated_at: col.updated_at || '',
    }))

  // Use theme from user_websites (new architecture)
  const theme = website.theme || 'light'
  const isDark = theme === 'dark'

  return (
    <WebsiteLayout 
      user={user} 
      theme={theme}
      categories={categoriesArray}
      collections={collectionsArray}
      announcements={announcements}
      announcementBarConfig={announcementBarConfig}
      shopDomain={params.domain}
    >
      {/* 1. Hero Carousel - matches Flutter order, with editor controls */}
      {heroCollections.length > 0 && (
        <EditableHeroCarousel 
          collections={heroCollections} 
          isDark={isDark}
          shopDomain={params.domain}
          config={heroConfig}
        />
      )}

      {/* Gold Rate Banner - matches Flutter gold rate section */}
      {goldRateSectionEnabled && goldRate && (
        <GoldRateBanner 
          goldRate={goldRate}
          isDark={isDark}
        />
      )}

      {/* 2. Categories - matches Flutter CategoryCarousel */}
      {categoriesArray.length > 0 && (
        <EditableCategories 
          categories={categoriesArray} 
          isDark={isDark}
          shopDomain={params.domain}
          config={categoriesConfig}
        />
      )}

      <div className="h-5" /> {/* Spacing */}

      {/* 3. Shop By Product Type - matches Flutter ShopByProductTypeSection */}
      {productTypes.length > 1 && (
        <ShopByProductTypeSection
          productTypes={productTypes}
          isDark={isDark}
          shopDomain={params.domain}
          title={shopByProductTypeConfig.title || "SHOP BY PRODUCT TYPE"}
          subtitle={shopByProductTypeConfig.subtitle || "Explore pieces by what you sell most"}
        />
      )}

      <div className="h-5" /> {/* Spacing */}
      {products.length > 0 && (
        <ProductsSection 
          products={products} 
          isDark={isDark}
          title={productsConfig.title || "New Arrivals"}
          subtitle={productsConfig.subtitle}
          limit={productsConfig.limit}
          columns={productsConfig.columns}
          showPrice={productsConfig.showPrice}
          shopDomain={params.domain}
          isDemo={isDemoProducts}
        />
      )}

      <div className="h-8" /> {/* Spacing */}

      {/* 4. Shop By Recipient (Him/Her) - matches Flutter ShopByRecipientSection */}
      <ShopByRecipientSection 
        isDark={isDark}
        config={shopByRecipientConfig}
        shopDomain={params.domain}
      />

      <div className="h-8" /> {/* Spacing */}

      {/* 5. Trending Collections - matches Flutter FourBoxStaggeredSection, with edit icons */}
      {trendingCollections.length > 0 && (
        <EditableTrendingSection 
          collections={trendingCollections} 
          isDark={isDark}
          shopDomain={params.domain}
          config={trendingConfig}
        />
      )}

      <div className="h-8" /> {/* Spacing */}

      {/* 6. Trending Products - matches Flutter TrendingProductsShowcase */}
      {trendingProducts.length > 0 && (
        <TrendingProductsSection 
          products={trendingProducts} 
          isDark={isDark}
          title={trendingProductsConfig.title}
          subtitle={trendingProductsConfig.subtitle}
          limit={trendingProductsConfig.limit}
          showPrice={trendingProductsConfig.showPrice}
          layout={trendingProductsConfig.layout}
          shopDomain={params.domain}
          isDemo={isDemoTrending}
        />
      )}

      <div className="h-5" /> {/* Spacing */}

      {/* 7. Best Collections - matches Flutter FeaturedCollectionsShowcase */}
      {bestCollections.length > 0 && (
        <EditableBestCollections 
          collections={bestCollections} 
          isDark={isDark}
          shopDomain={params.domain}
          config={bestCollectionsConfig}
        />
      )}

      {/* 8. Testimonials - matches Flutter JewelleryTestimonialSection */}
      {testimonials.length > 0 && (
        <div className="mt-5">
          <TestimonialsSection 
            testimonials={testimonials} 
            isDark={isDark}
            title={testimonialsConfig.title}
            subtitle={testimonialsConfig.subtitle}
            layout={testimonialsConfig.layout}
            showRating={testimonialsConfig.showRating}
            showAvatar={testimonialsConfig.showAvatar}
            maxItems={testimonialsConfig.maxItems}
          />
        </div>
      )}

      {/* Footer */}
      <EditableFooter 
        user={{ ...user, facebook_id: storeInfo?.facebook_id || null }}
        template={{ 
          id: website.id,
          user_id: user.id,
          theme: website.theme,
          website_type: website.website_type,
          website_url: website.website_url,
          footer: footerData,
          created_at: website.created_at,
          updated_at: website.updated_at,
        } as any}
        isDark={isDark}
        shopDomain={params.domain}
      />
    </WebsiteLayout>
  )
}
