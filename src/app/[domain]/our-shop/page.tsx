import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWebsiteByDomain, getWebsiteTemplate, getCategoriesMap, getCollectionsMap, getStoreInfoForUser } from '@/lib/supabase'
import { getFooterDataForUser, getPageContentForUser } from '@/lib/supabase-new-architecture'
import WebsiteLayout from '@/components/layout/WebsiteLayout'
import Footer from '@/components/sections/Footer'
import EditableOurShopPage from '@/components/pages/EditableOurShopPage'

// Enable ISR - revalidate every 24 hours (static content)
export const revalidate = 86400 // 24 hours - our shop page cached at edge

interface PageProps {
  params: { domain: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const user = await getWebsiteByDomain(params.domain)
  return {
    title: `Our Shop | ${user?.shop_name || 'Store'}`,
    description: `Visit ${user?.shop_name || 'our store'} - Find our location and contact details.`,
  }
}

export default async function OurShopPage({ params }: PageProps) {
  const startTime = Date.now()
  console.log(`[ISR] 🏪 OUR SHOP PAGE | Domain: ${params.domain} | Cache: 86400s (24h) | ${new Date().toISOString()}`)

  const user = await getWebsiteByDomain(params.domain)
  if (!user) { console.log(`[ISR] ❌ User not found: ${params.domain}`); notFound() }
  console.log(`[ISR] ✅ User: ${user.shop_name} (${user.id})`)

  const [template, categoriesMap, collectionsMap, footerData, pageContent, storeInfo] = await Promise.all([
    getWebsiteTemplate(user.id),
    getCategoriesMap(user.id),
    getCollectionsMap(user.id),
    getFooterDataForUser(user.id),
    getPageContentForUser(user.id, 'our-shop'),
    getStoreInfoForUser(user.id),
  ])

  const categoriesArray = Object.entries(categoriesMap).map(([name, imageUrl], index) => ({
    id: String(index), user_id: user.id, name, image_url: imageUrl as string | null,
    description: null, display_order: index, created_at: '', updated_at: '',
  }))

  const collectionsArray = Object.entries(collectionsMap).map(([name, bannerUrl], index) => ({
    id: String(index), user_id: user.id, name, banner_url: bannerUrl as string | null,
    description: null, display_order: index, created_at: '', updated_at: '',
  }))

  const theme = template?.theme || 'light'
  const isDark = theme === 'dark'

  const pageTitle = pageContent?.title || 'Our Shop'
  const defaultContent = `Welcome to ${user.shop_name || 'our store'}!

We are a premier jewelry destination offering exquisite pieces crafted with passion and precision. Each piece in our collection tells a unique story and is designed to make you shine.

Visit us to explore our stunning collection of rings, necklaces, earrings, bracelets, and more. Our expert team is dedicated to helping you find the perfect piece for any occasion.

We look forward to serving you!`
  const content = pageContent?.content || defaultContent

  const businessHours = storeInfo?.hours || []

  return (
    <WebsiteLayout user={user} theme={theme} categories={categoriesArray} collections={collectionsArray} shopDomain={params.domain}>
      <EditableOurShopPage
        userId={user.id}
        user={user}
        initialTitle={pageTitle}
        initialContent={content}
        isDark={isDark}
        businessHours={businessHours}
      />
      <Footer user={user} template={template ? { ...template, footer: footerData } : null} isDark={isDark} />
    </WebsiteLayout>
  )
}
