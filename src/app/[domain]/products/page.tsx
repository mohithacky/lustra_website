import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWebsiteByDomain, getWebsiteTemplate, getProductsWithDemoFallback, getCategoriesMap, getCollectionsMap } from '@/lib/supabase'
import { getFooterDataForUser } from '@/lib/supabase-new-architecture'
import WebsiteLayout from '@/components/layout/WebsiteLayout'
import ProductsGrid from '@/components/products/ProductsGrid'
import Footer from '@/components/sections/Footer'

interface PageProps {
  params: { domain: string }
  searchParams: { category?: string; collection?: string; filter?: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const user = await getWebsiteByDomain(params.domain)
  
  if (!user) {
    return { title: 'Products Not Found' }
  }

  return {
    title: `Products - ${user.shop_name || 'Jewelry Store'}`,
    description: `Browse our collection of beautiful jewelry at ${user.shop_name}`,
  }
}

export default async function ProductsPage({ params, searchParams }: PageProps) {
  const user = await getWebsiteByDomain(params.domain)
  
  if (!user) {
    notFound()
  }

  const [template, productsResult, categoriesMap, collectionsMap, footerData] = await Promise.all([
    getWebsiteTemplate(user.id),
    getProductsWithDemoFallback(user.id, {
      category: searchParams.category,
      collection: searchParams.collection,
      limit: 50,
    }),
    getCategoriesMap(user.id),
    getCollectionsMap(user.id),
    getFooterDataForUser(user.id),
  ])

  const { products, isDemo: isDemoProducts } = productsResult

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
        categories={Object.keys(categoriesMap)}
        collections={Object.keys(collectionsMap)}
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
