import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProductsWithDemoFallback } from '@/lib/supabase'
import {
  getWebsiteRenderData,
  getTrendingCollections as getTrendingFromSections,
  getCategoryCollections,
  getProductTypeCollections,
  getFooterDataFromPages,
  transformCategoriesToMap,
  Collection,
} from '@/lib/supabase-new-architecture'
import WebsiteLayout from '@/components/layout/WebsiteLayout'
import ProductsGrid from '@/components/products/ProductsGrid'
import Footer from '@/components/sections/Footer'

interface PageProps {
  params: { domain: string }
  searchParams: { category?: string; collection?: string; filter?: string; productType?: string; trending?: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const renderData = await getWebsiteRenderData(params.domain)
  
  if (!renderData) {
    return { title: 'Products Not Found' }
  }

  return {
    title: `Products - ${renderData.user.shop_name || 'Jewelry Store'}`,
    description: `Browse our collection of beautiful jewelry at ${renderData.user.shop_name}`,
  }
}

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ProductsPage({ params, searchParams }: PageProps) {
  // Use new architecture to get website render data (same as home page)
  const renderData = await getWebsiteRenderData(params.domain)
  
  if (!renderData) {
    notFound()
  }

  const { user, website, template, sections } = renderData

  if (!user || !website || !template || !sections) {
    notFound()
  }

  // Get collections from sections (same as home page)
  const trendingCollections = getTrendingFromSections(sections)
  const categoryCollections = getCategoryCollections(sections)
  const productTypeCollections = getProductTypeCollections(sections)
  
  // Get all collections for the mega menu (combining different types)
  // For mega menu, we use category collections as the main "collections"
  const allCollections = categoryCollections

  // Fetch footer data
  const footerData = await getFooterDataFromPages(sections, website.id)

  // Fetch products
  const productsResult = await getProductsWithDemoFallback(user.id, {
    category: searchParams.category,
    collection: searchParams.collection,
    limit: 50,
  })

  const { products, isDemo: isDemoProducts } = productsResult

  // Transform categories to map for legacy compatibility
  const categoriesMap = transformCategoriesToMap(categoryCollections)

  // Build filter data from new architecture collections
  const filterCategories = categoryCollections.map(c => c.name)
  const filterCollections = allCollections.map(c => c.name)
  const filterProductTypes = productTypeCollections.map(c => c.name)
  const filterTrendingCollections = trendingCollections.map(c => c.name)

  // Build categories array for mega menu (from category collections)
  const categoriesArray = categoryCollections.map((collection, index) => ({
    id: collection.id,
    user_id: user.id,
    name: collection.name,
    image_url: collection.image_url || '',
    description: null,
    display_order: collection.display_order || index,
    created_at: '',
    updated_at: '',
  }))

  // Build collections array for mega menu (use trending + best for variety)
  const collectionsArray = [...trendingCollections, ...categoryCollections].slice(0, 10).map((collection, index) => ({
    id: collection.id,
    user_id: user.id,
    name: collection.name,
    banner_url: collection.image_url || '',
    description: null,
    display_order: collection.display_order || index,
    created_at: '',
    updated_at: '',
  }))

  const theme = website?.theme || 'light'
  const isDark = theme === 'dark'

  const pageTitle = searchParams.category || searchParams.collection || searchParams.productType || searchParams.trending || searchParams.filter || 'All Products'

  return (
    <WebsiteLayout 
      user={user} 
      theme={theme}
      categories={categoriesArray}
      collections={collectionsArray}
    >
      <ProductsGrid
        products={products}
        isDark={isDark}
        shopDomain={params.domain}
        shopId={user.id}
        title={pageTitle}
        categories={filterCategories}
        collections={filterCollections}
        productTypes={filterProductTypes}
        trendingCollections={filterTrendingCollections}
        isDemo={isDemoProducts}
      />
      <Footer 
        user={user}
        template={template ? { ...template, footer: footerData } : null}
        isDark={isDark}
      />
    </WebsiteLayout>
  )
}
