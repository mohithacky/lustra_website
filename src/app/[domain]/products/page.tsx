import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProductsWithDemoFallback } from '@/lib/supabase'
import { 
  getWebsiteRenderData,
  getHeroCollections,
  getTrendingCollections,
  getCategoryCollections,
  getProductTypeCollections,
  getFooterDataFromPages,
  transformHeroToLegacy,
  transformTrendingToLegacy,
  transformCategoriesToMap,
  Collection,
} from '@/lib/supabase-new-architecture'
import WebsiteLayout from '@/components/layout/WebsiteLayout'
import ProductsGrid from '@/components/products/ProductsGrid'
import { EditableFooter } from '@/components/editor/EditableSections'

interface PageProps {
  params: { domain: string }
  searchParams: { category?: string; collection?: string; filter?: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const renderData = await getWebsiteRenderData(params.domain)
  
  if (!renderData) {
    return { title: 'Products Not Found' }
  }

  const { user } = renderData

  return {
    title: `Products - ${user.shop_name || 'Jewelry Store'}`,
    description: `Browse our collection of beautiful jewelry at ${user.shop_name}`,
  }
}

export default async function ProductsPage({ params, searchParams }: PageProps) {
  const renderData = await getWebsiteRenderData(params.domain)
  
  if (!renderData) {
    notFound()
  }

  const { user, website, template, sections } = renderData

  if (!user || !website || !template || !sections) {
    console.error('[PRODUCTS PAGE] Missing required render data')
    notFound()
  }

  // Get collections from merged sections
  const heroCollectionsFromSections = getHeroCollections(sections)
  const trendingCollectionsFromSections = getTrendingCollections(sections)
  const categoryCollections = getCategoryCollections(sections)
  const productTypes = getProductTypeCollections(sections)

  // Transform to legacy format for layout
  const heroCollections = transformHeroToLegacy(heroCollectionsFromSections)
  const trendingCollections = transformTrendingToLegacy(trendingCollectionsFromSections)
  const categoriesMap = transformCategoriesToMap(categoryCollections)

  // Fetch footer data
  const footerData = await getFooterDataFromPages(sections, website.id)

  // Fetch products
  const productsResult = await getProductsWithDemoFallback(user.id, {
    category: searchParams.category,
    collection: searchParams.collection,
    limit: 50,
  })

  const { products, isDemo: isDemoProducts } = productsResult

  // Transform categories and collections to arrays for layout
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

  const collectionsArray = heroCollectionsFromSections.map((col: Collection, index: number) => ({
    id: col.id,
    user_id: col.user_id,
    name: col.name,
    banner_url: (col.image_url || '') as string,
    description: null as string | null,
    display_order: col.display_order,
    created_at: col.created_at || '',
    updated_at: col.updated_at || '',
  }))

  // Extract filter data from real collections
  const filterCategories = categoryCollections.map(c => c.name)
  const filterCollections = heroCollectionsFromSections.map(c => c.name)
  const filterTrendingCollections = trendingCollectionsFromSections.map(c => c.name)
  const filterProductTypes = productTypes.map(pt => pt.name)

  const theme = website.theme || 'light'
  const isDark = theme === 'dark'

  const pageTitle = searchParams.category || searchParams.collection || searchParams.filter || 'All Products'

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
        trendingCollections={filterTrendingCollections}
        productTypes={filterProductTypes}
        isDemo={isDemoProducts}
      />
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
