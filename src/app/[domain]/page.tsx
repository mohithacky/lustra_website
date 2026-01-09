import { Metadata } from 'next'
import { notFound } from 'next/navigation'
// New Architecture imports
import {
  getWebsiteRenderData,
  getHeroCollections as getHeroFromSections,
  getTrendingCollections as getTrendingFromSections,
  getCategoryCollections,
  getBestCollections as getBestFromSections,
  getFooterDataFromPages,
  isTestimonialsEnabled,
  transformHeroToLegacy,
  transformTrendingToLegacy,
  transformCategoriesToMap,
  transformBestToLegacy,
  Collection,
} from '@/lib/supabase-new-architecture'
// Legacy imports for products (still using old tables)
import { 
  getProducts, 
  getTestimonials,
  getTrendingProducts,
  getWebsiteByDomain as getWebsiteByDomainLegacy,
} from '@/lib/supabase'
import WebsiteLayout from '@/components/layout/WebsiteLayout'
import ProductsSection from '@/components/sections/ProductsSection'
import ShopByRecipientSection from '@/components/sections/ShopByRecipientSection'
import TrendingProductsSection from '@/components/sections/TrendingProductsSection'
import TestimonialsSection from '@/components/sections/TestimonialsSection'
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

// Force dynamic rendering - disable caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

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

  // Log render data summary
  console.log(`\n[PAGE] Rendering StorePage for domain: ${params.domain}`)
  console.log(`[PAGE] User: ${user.id} (${user.shop_name})`)
  console.log(`[PAGE] Sections received: ${sections.length}`)

  // Get collections from merged sections
  const heroCollectionsFromSections = getHeroFromSections(sections)
  const trendingCollectionsFromSections = getTrendingFromSections(sections)
  const categoryCollections = getCategoryCollections(sections)
  const bestCollectionsFromSections = getBestFromSections(sections)
  const showTestimonials = isTestimonialsEnabled(sections)
  
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

  // Fetch products using legacy table (still using website_products)
  const [products, testimonials, trendingProducts] = await Promise.all([
    getProducts(user.id, { limit: 12 }),
    showTestimonials ? getTestimonials(user.id) : Promise.resolve([]),
    getTrendingProducts(user.id, 10),
  ])

  console.log(`  - Products: ${products.length}`)
  console.log(`  - Testimonials: ${testimonials.length}`)
  console.log(`  - Trending products: ${trendingProducts.length}`)

  // Transform categories map to array format for components
  const categoriesArray = Object.entries(categoriesMap).map(([name, imageUrl], index) => ({
    id: String(index),
    user_id: user.id,
    name,
    image_url: imageUrl,
    description: null,
    display_order: index,
    created_at: '',
    updated_at: '',
  }))

  // Transform hero collections to collections array format for layout
  const collectionsArray = heroCollectionsFromSections.map((col: Collection, index: number) => ({
    id: col.id,
    user_id: col.user_id,
    name: col.name,
    banner_url: col.image_url || '',
    description: null as string | null,
    display_order: col.display_order,
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
    >
      {/* 1. Hero Carousel - matches Flutter order, with editor controls */}
      {heroCollections.length > 0 && (
        <EditableHeroCarousel 
          collections={heroCollections} 
          isDark={isDark}
          shopDomain={params.domain}
        />
      )}

      {/* 2. Categories - matches Flutter CategoryCarousel */}
      {categoriesArray.length > 0 && (
        <EditableCategories 
          categories={categoriesArray} 
          isDark={isDark}
          shopDomain={params.domain}
        />
      )}

      <div className="h-10" /> {/* Spacing */}

      {/* 3. Products Section (New Arrivals) - matches Flutter ProductShowcase */}
      {products.length > 0 && (
        <ProductsSection 
          products={products} 
          isDark={isDark}
          title="New Arrivals"
          shopDomain={params.domain}
        />
      )}

      <div className="h-16" /> {/* Spacing */}

      {/* 4. Shop By Recipient (Him/Her) - matches Flutter ShopByRecipientSection */}
      <ShopByRecipientSection 
        isDark={isDark}
        shopDomain={params.domain}
      />

      <div className="h-16" /> {/* Spacing */}

      {/* 5. Trending Collections - matches Flutter FourBoxStaggeredSection, with edit icons */}
      {trendingCollections.length > 0 && (
        <EditableTrendingSection 
          collections={trendingCollections} 
          isDark={isDark}
          shopDomain={params.domain}
        />
      )}

      <div className="h-16" /> {/* Spacing */}

      {/* 6. Trending Products - matches Flutter TrendingProductsShowcase */}
      {trendingProducts.length > 0 && (
        <TrendingProductsSection 
          products={trendingProducts} 
          isDark={isDark}
          shopDomain={params.domain}
        />
      )}

      <div className="h-10" /> {/* Spacing */}

      {/* 7. Best Collections - matches Flutter FeaturedCollectionsShowcase */}
      {bestCollections.length > 0 && (
        <EditableBestCollections 
          collections={bestCollections} 
          isDark={isDark}
          shopDomain={params.domain}
        />
      )}

      {/* 8. Testimonials - matches Flutter JewelleryTestimonialSection */}
      {testimonials.length > 0 && (
        <div className="mt-10">
          <TestimonialsSection 
            testimonials={testimonials} 
            isDark={isDark} 
          />
        </div>
      )}

      {/* Footer */}
      <EditableFooter 
        user={user}
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
