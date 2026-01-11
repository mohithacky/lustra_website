import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWebsiteByDomain, getWebsiteTemplate, getProductsByType, getCategoriesMap, getCollectionsMap, getFooterData } from '@/lib/supabase'
import WebsiteLayout from '@/components/layout/WebsiteLayout'
import ProductsGrid from '@/components/products/ProductsGrid'
import Footer from '@/components/sections/Footer'

interface PageProps {
  params: { domain: string; productType: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const productType = decodeURIComponent(params.productType).replace(/-/g, ' ')
  const capitalizedType = productType.charAt(0).toUpperCase() + productType.slice(1)
  const user = await getWebsiteByDomain(params.domain)
  
  if (!user) {
    return { title: 'Product Type Not Found' }
  }

  return {
    title: `${capitalizedType} Jewelry - ${user.shop_name || 'Jewelry Store'}`,
    description: `Browse our ${capitalizedType} jewelry collection at ${user.shop_name}`,
  }
}

export default async function ProductTypePage({ params }: PageProps) {
  const user = await getWebsiteByDomain(params.domain)
  
  if (!user) {
    notFound()
  }

  const productType = decodeURIComponent(params.productType).replace(/-/g, ' ')
  const capitalizedType = productType.charAt(0).toUpperCase() + productType.slice(1)

  const [template, products, categoriesMap, collectionsMap, footerData] = await Promise.all([
    getWebsiteTemplate(user.id),
    getProductsByType(user.id, productType, 50),
    getCategoriesMap(user.id),
    getCollectionsMap(user.id),
    getFooterData(user.id),
  ])

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
      <ProductsGrid
        products={products}
        isDark={isDark}
        shopDomain={params.domain}
        shopId={user.id}
        title={`${capitalizedType} Jewelry`}
        categories={Object.keys(categoriesMap)}
        collections={Object.keys(collectionsMap)}
      />
      <Footer 
        user={user}
        template={template ? { ...template, footer: footerData } : null}
        isDark={isDark}
      />
    </WebsiteLayout>
  )
}
