import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWebsiteByDomain, getWebsiteTemplate, getCategoriesMap, getCollectionsMap } from '@/lib/supabase'
import { getFooterDataForUser, getPageContentForUser } from '@/lib/supabase-new-architecture'
import WebsiteLayout from '@/components/layout/WebsiteLayout'
import Footer from '@/components/sections/Footer'
import EditableOurShopPage from '@/components/pages/EditableOurShopPage'

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
  const user = await getWebsiteByDomain(params.domain)
  if (!user) notFound()

  const [template, categoriesMap, collectionsMap, footerData, pageContent] = await Promise.all([
    getWebsiteTemplate(user.id),
    getCategoriesMap(user.id),
    getCollectionsMap(user.id),
    getFooterDataForUser(user.id),
    getPageContentForUser(user.id, 'our-shop'),
  ])

  const categoriesArray = Object.entries(categoriesMap).map(([name, imageUrl], index) => ({
    id: String(index), user_id: user.id, name, image_url: imageUrl,
    description: null, display_order: index, created_at: '', updated_at: '',
  }))

  const collectionsArray = Object.entries(collectionsMap).map(([name, bannerUrl], index) => ({
    id: String(index), user_id: user.id, name, banner_url: bannerUrl,
    description: null, display_order: index, created_at: '', updated_at: '',
  }))

  const theme = template?.theme || 'light'
  const isDark = theme === 'dark'

  const pageTitle = pageContent?.title || 'Our Shop'
  const content = pageContent?.content || ''

  return (
    <WebsiteLayout user={user} theme={theme} categories={categoriesArray} collections={collectionsArray} shopDomain={params.domain}>
      <EditableOurShopPage
        userId={user.id}
        user={user}
        initialTitle={pageTitle}
        initialContent={content}
        isDark={isDark}
      />
      <Footer user={user} template={template ? { ...template, footer: footerData } : null} isDark={isDark} />
    </WebsiteLayout>
  )
}
