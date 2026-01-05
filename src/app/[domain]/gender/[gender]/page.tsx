import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWebsiteByDomain, getWebsiteTemplate, getProductsByGender, getCategoriesMap, getCollectionsMap } from '@/lib/supabase'
import WebsiteLayout from '@/components/layout/WebsiteLayout'
import ProductsGrid from '@/components/products/ProductsGrid'

interface PageProps {
  params: { domain: string; gender: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const gender = params.gender === 'him' ? 'Him' : 'Her'
  const user = await getWebsiteByDomain(params.domain)
  
  if (!user) {
    return { title: 'Products Not Found' }
  }

  return {
    title: `Shop for ${gender} - ${user.shop_name || 'Jewelry Store'}`,
    description: `Browse jewelry for ${gender} at ${user.shop_name}`,
  }
}

export default async function GenderPage({ params }: PageProps) {
  const user = await getWebsiteByDomain(params.domain)
  
  if (!user) {
    notFound()
  }

  const gender = params.gender === 'him' ? 'Him' : 'Her'

  const [template, products, categoriesMap, collectionsMap] = await Promise.all([
    getWebsiteTemplate(user.id),
    getProductsByGender(user.id, gender, 50),
    getCategoriesMap(user.id),
    getCollectionsMap(user.id),
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
        title={`Shop for ${gender}`}
        categories={Object.keys(categoriesMap)}
        collections={Object.keys(collectionsMap)}
      />
    </WebsiteLayout>
  )
}
