import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWebsiteByDomain, getWebsiteTemplate, getProducts, getCategoriesMap, getCollectionsMap, getFooterData } from '@/lib/supabase'
import WebsiteLayout from '@/components/layout/WebsiteLayout'
import ProductsGrid from '@/components/products/ProductsGrid'
import Footer from '@/components/sections/Footer'

interface PageProps {
  params: { domain: string; categoryName: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const categoryName = decodeURIComponent(params.categoryName).replace(/-/g, ' ')
  const user = await getWebsiteByDomain(params.domain)
  
  if (!user) {
    return { title: 'Category Not Found' }
  }

  return {
    title: `${categoryName} - ${user.shop_name || 'Jewelry Store'}`,
    description: `Browse ${categoryName} collection at ${user.shop_name}`,
  }
}

export default async function CategoryPage({ params }: PageProps) {
  const user = await getWebsiteByDomain(params.domain)
  
  if (!user) {
    notFound()
  }

  const categoryName = decodeURIComponent(params.categoryName).replace(/-/g, ' ')

  const [template, products, categoriesMap, collectionsMap, footerData] = await Promise.all([
    getWebsiteTemplate(user.id),
    getProducts(user.id, { category: categoryName, limit: 50 }),
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
        title={categoryName}
        categories={Object.keys(categoriesMap)}
        collections={Object.keys(collectionsMap)}
        trendingCollections={[]}
        productTypes={[]}
      />
      <Footer 
        user={user}
        template={template ? { ...template, footer: footerData } : null}
        isDark={isDark}
      />
    </WebsiteLayout>
  )
}
