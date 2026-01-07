import { Metadata } from 'next'
import { notFound } from 'next/navigation'
// New Architecture imports
import {
  getWebsiteRenderData,
  getHeroCollections as getHeroFromSections,
  getTrendingCollections as getTrendingFromSections,
  getCategoryCollections,
  getBestCollections as getBestFromSections,
  getFooterData as getFooterFromSections,
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
import CategoriesSection from '@/components/sections/CategoriesSection'
import ProductsSection from '@/components/sections/ProductsSection'
import ShopByRecipientSection from '@/components/sections/ShopByRecipientSection'
import TrendingProductsSection from '@/components/sections/TrendingProductsSection'
import BestCollectionsSection from '@/components/sections/BestCollectionsSection'
import TestimonialsSection from '@/components/sections/TestimonialsSection'
import Footer from '@/components/sections/Footer'
import { EditableHeroCarousel, EditableTrendingSection } from '@/components/editor/EditableSections'

interface PageProps {
  params: { domain: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
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

export default async function StorePage({ params }: PageProps) {
  // ============================================================================
  // NEW ARCHITECTURE: Use the new rendering flow
  // ============================================================================
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
  const footerData = getFooterFromSections(sections)
  const showTestimonials = isTestimonialsEnabled(sections)

  // Transform to legacy format for existing components
  const heroCollections = transformHeroToLegacy(heroCollectionsFromSections)
  const trendingCollections = transformTrendingToLegacy(trendingCollectionsFromSections)
  const categoriesMap = transformCategoriesToMap(categoryCollections)
  const bestCollections = transformBestToLegacy(bestCollectionsFromSections)

  // Fetch products using legacy table (still using website_products)
  const [products, testimonials, trendingProducts] = await Promise.all([
    getProducts(user.id, { limit: 12 }),
    showTestimonials ? getTestimonials(user.id) : Promise.resolve([]),
    getTrendingProducts(user.id, 10),
  ])

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
        <CategoriesSection 
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
        <BestCollectionsSection 
          collections={bestCollections} 
          isDark={isDark}
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
      <Footer 
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
      />
    </WebsiteLayout>
  )
}
