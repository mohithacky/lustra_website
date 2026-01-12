import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWebsiteByDomain, getWebsiteTemplate, getProductByIdWithDemoFallback, getCategoriesMapWithDemoFallback, getCollectionsMapWithDemoFallback, getProductsWithDemoFallback } from '@/lib/supabase'
import { getFooterDataForUser } from '@/lib/supabase-new-architecture'
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

export default async function ProductDetailPage({ params }: PageProps) {
  const user = await getWebsiteByDomain(params.domain)
  
  if (!user) {
    notFound()
  }

  const [template, productResult, categoriesResult, collectionsResult, relatedProductsResult, footerData] = await Promise.all([
    getWebsiteTemplate(user.id),
    getProductByIdWithDemoFallback(params.productId),
    getCategoriesMapWithDemoFallback(user.id),
    getCollectionsMapWithDemoFallback(user.id),
    getProductsWithDemoFallback(user.id, { limit: 5 }),
    getFooterDataForUser(user.id),
  ])

  const { product, isDemo } = productResult
  const { categories: categoriesMap } = categoriesResult
  const { collections: collectionsMap } = collectionsResult
  const { products: relatedProducts } = relatedProductsResult

  if (!product) {
    notFound()
  }

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

  const collectionsArray = Object.entries(collectionsMap).map(([name, bannerUrl], index) => ({
    id: String(index),
    user_id: user.id,
    name,
    banner_url: bannerUrl as string,
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
