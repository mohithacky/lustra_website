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
  getTestimonials 
} from '@/lib/supabase'
import WebsiteLayout from '@/components/layout/WebsiteLayout'
import HeroCarousel from '@/components/sections/HeroCarousel'
import TrendingSection from '@/components/sections/TrendingSection'
import CategoriesSection from '@/components/sections/CategoriesSection'
import BestCollectionsSection from '@/components/sections/BestCollectionsSection'
import ProductsSection from '@/components/sections/ProductsSection'
import TestimonialsSection from '@/components/sections/TestimonialsSection'
import Footer from '@/components/sections/Footer'

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

  const [template, heroCollections, products, collectionsMap, categoriesMap, trendingCollections, bestCollections, footerData, testimonials] = await Promise.all([
    getWebsiteTemplate(user.id),
    getHeroCollections(user.id),
    getProducts(user.id, { limit: 12 }),
    getCollectionsMap(user.id),
    getCategoriesMap(user.id),
    getTrendingCollections(user.id),
    getBestCollections(user.id),
    getFooterData(user.id),
    getTestimonials(user.id),
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
      {/* Hero Carousel */}
      {heroCollections.length > 0 && (
        <HeroCarousel 
          collections={heroCollections} 
          isDark={isDark} 
        />
      )}

      {/* Trending Collections */}
      {trendingCollections.length > 0 && (
        <TrendingSection 
          collections={trendingCollections} 
          isDark={isDark} 
        />
      )}

      {/* Categories */}
      {categoriesArray.length > 0 && (
        <CategoriesSection 
          categories={categoriesArray} 
          isDark={isDark}
          shopDomain={params.domain}
        />
      )}

      {/* Best Collections */}
      {bestCollections.length > 0 && (
        <BestCollectionsSection 
          collections={bestCollections} 
          isDark={isDark} 
        />
      )}

      {/* Products Section */}
      {products.length > 0 && (
        <ProductsSection 
          products={products} 
          isDark={isDark}
          title="New Arrivals"
          shopDomain={params.domain}
        />
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <TestimonialsSection 
          testimonials={testimonials} 
          isDark={isDark} 
        />
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
