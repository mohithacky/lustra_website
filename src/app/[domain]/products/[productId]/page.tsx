import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProductByIdWithDemoFallback, getProductsWithDemoFallback } from '@/lib/supabase'
import { 
  getWebsiteRenderData,
  getHeroCollections,
  getCategoryCollections,
  getFooterDataFromPages,
  transformCategoriesToMap,
  Collection,
} from '@/lib/supabase-new-architecture'
import WebsiteLayout from '@/components/layout/WebsiteLayout'
import ProductDetail from '@/components/products/ProductDetail'
import { EditableFooter } from '@/components/editor/EditableSections'
import { supabase } from '@/lib/supabase'

// Enable ISR - revalidate every hour
export const revalidate = 3600 // 1 hour - product data cached at edge

interface PageProps {
  params: { domain: string; productId: string }
}

// Pre-generate top 100 most recent products at build time
export async function generateStaticParams() {
  try {
    const { data: products } = await supabase
      .from('products')
      .select('id, user_id, users!inner(shop_domain)')
      .eq('show_on_website', true)
      .order('created_at', { ascending: false })
      .limit(100)
    
    if (!products) return []
    
    return products.map((p: any) => ({
      domain: p.users.shop_domain,
      productId: p.id,
    }))
  } catch (error) {
    console.error('[generateStaticParams] Error:', error)
    return []
  }
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

export default async function ProductDetailPage({ params }: PageProps) {
  const renderData = await getWebsiteRenderData(params.domain)
  
  if (!renderData) {
    notFound()
  }

  const { user, website, template, sections } = renderData

  if (!user || !website || !template || !sections) {
    console.error('[PRODUCT DETAIL PAGE] Missing required render data')
    notFound()
  }

  // Get collections from merged sections
  const heroCollectionsFromSections = getHeroCollections(sections)
  const categoryCollections = getCategoryCollections(sections)

  // Transform to legacy format for layout
  const categoriesMap = transformCategoriesToMap(categoryCollections)

  // Fetch footer data, product, and related products
  const [footerData, productResult, relatedProductsResult] = await Promise.all([
    getFooterDataFromPages(sections, website.id),
    getProductByIdWithDemoFallback(params.productId),
    getProductsWithDemoFallback(user.id, { limit: 5 }),
  ])

  const { product, isDemo } = productResult
  const { products: relatedProducts } = relatedProductsResult

  if (!product) {
    notFound()
  }

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

  const theme = website.theme || 'light'
  const isDark = theme === 'dark'

  return (
    <WebsiteLayout 
      user={user} 
      theme={theme}
      categories={categoriesArray}
      collections={collectionsArray}
      shopDomain={params.domain}
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
