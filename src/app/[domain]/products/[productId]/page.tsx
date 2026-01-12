import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProductByIdWithDemoFallback, getProductsWithDemoFallback } from '@/lib/supabase'
import {
  getWebsiteRenderData,
  getTrendingCollections as getTrendingFromSections,
  getCategoryCollections,
  getFooterDataFromPages,
} from '@/lib/supabase-new-architecture'
import WebsiteLayout from '@/components/layout/WebsiteLayout'
import ProductDetail from '@/components/products/ProductDetail'
import Footer from '@/components/sections/Footer'

interface PageProps {
  params: { domain: string; productId: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { product } = await getProductByIdWithDemoFallback(params.productId)
  
  if (!product) {
    return { title: 'Product Not Found' }
  }

  return {
    title: `${product.name} - Jewelry`,
    description: product.description || `Beautiful ${product.name} jewelry piece`,
    openGraph: {
      images: product.image_url ? [product.image_url] : [],
    },
  }
}

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ProductDetailPage({ params }: PageProps) {
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

  // Fetch footer data
  const footerData = await getFooterDataFromPages(sections, website.id)

  // Fetch product and related products
  const [productResult, relatedProductsResult] = await Promise.all([
    getProductByIdWithDemoFallback(params.productId),
    getProductsWithDemoFallback(user.id, { limit: 5 }),
  ])

  const { product, isDemo } = productResult
  const { products: relatedProducts } = relatedProductsResult

  if (!product) {
    notFound()
  }

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

  // Build collections array for mega menu (use trending + category for variety)
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

  return (
    <WebsiteLayout 
      user={user} 
      theme={theme}
      categories={categoriesArray}
      collections={collectionsArray}
    >
      <ProductDetail
        product={product}
        relatedProducts={relatedProducts.filter((p: any) => p.id !== product.id).slice(0, 4)}
        isDemo={isDemo}
        isDark={isDark}
        shopDomain={params.domain}
        shopName={user.shop_name}
        phoneNumber={user.phone_number}
        shopId={user.id}
      />
      <Footer 
        user={user}
        template={template ? { ...template, footer: footerData } : null}
        isDark={isDark}
      />
    </WebsiteLayout>
  )
}
