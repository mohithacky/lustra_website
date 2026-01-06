import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { 
  getWebsiteByDomain, 
  getWebsiteTemplate, 
  getHeroCollections, 
  getProducts, 
  getCollectionsMap,
  getCategoriesMap,
  getTrendingCollections,
  getBestCollections,
  getFooterData,
  getTestimonials,
  getTrendingProducts,
  getSectionConfig
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
  const user = await getWebsiteByDomain(params.domain)
  
  if (!user) {
    return {
      title: 'Store Not Found',
    }
  }

  return {
    title: `${user.shop_name || 'Jewelry Store'} - Exquisite Jewelry Collection`,
    description: `Discover beautiful jewelry at ${user.shop_name}. Browse our collection of rings, necklaces, earrings, and more.`,
    openGraph: {
      title: user.shop_name || 'Jewelry Store',
      description: `Discover beautiful jewelry at ${user.shop_name}`,
      images: user.logo_url ? [user.logo_url] : [],
    },
  }
}

export default async function StorePage({ params }: PageProps) {
  const user = await getWebsiteByDomain(params.domain)
  
  if (!user) {
    notFound()
  }

  const [template, heroCollections, products, collectionsMap, categoriesMap, trendingCollections, bestCollections, footerData, testimonials, trendingProducts, heroCarouselConfig] = await Promise.all([
    getWebsiteTemplate(user.id),
    getHeroCollections(user.id),
    getProducts(user.id, { limit: 12 }),
    getCollectionsMap(user.id),
    getCategoriesMap(user.id),
    getTrendingCollections(user.id),
    getBestCollections(user.id),
    getFooterData(user.id),
    getTestimonials(user.id),
    getTrendingProducts(user.id, 10),
    getSectionConfig(user.id, 'hero_carousel'),
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

  // Transform collections map to array format for components
  const collectionsArray = Object.entries(collectionsMap).map(([name, bannerUrl], index) => ({
    id: String(index),
    user_id: user.id,
    name,
    banner_url: bannerUrl,
    description: null,
    display_order: index,
    created_at: '',
    updated_at: '',
  }))

  const theme = template?.theme || 'light'
  const isDark = theme === 'dark'

  return (
    <WebsiteLayout 
      user={user} 
      theme={theme}
      categories={categoriesArray}
      collections={collectionsArray}
    >
      {/* 1. Hero Carousel - config from user_website_sections.config */}
      {heroCollections.length > 0 && (
        <EditableHeroCarousel 
          collections={heroCollections}
          config={heroCarouselConfig ?? undefined}
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
        template={template ? { ...template, footer: footerData } : null}
        isDark={isDark}
      />
    </WebsiteLayout>
  )
}
