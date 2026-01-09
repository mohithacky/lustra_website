import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWebsiteByDomain, getWebsiteTemplate, getCategoriesMap, getCollectionsMap } from '@/lib/supabase'
import { getFooterDataForUser, getPageContentForUser } from '@/lib/supabase-new-architecture'
import WebsiteLayout from '@/components/layout/WebsiteLayout'
import Footer from '@/components/sections/Footer'
import EditableStaticPage from '@/components/pages/EditableStaticPage'

interface PageProps {
  params: { domain: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const user = await getWebsiteByDomain(params.domain)
  
  if (!user) {
    return { title: 'Terms of Service' }
  }

  return {
    title: `Terms of Service - ${user.shop_name || 'Jewelry Store'}`,
    description: `Terms of Service for ${user.shop_name}`,
  }
}

export default async function TermsPage({ params }: PageProps) {
  const user = await getWebsiteByDomain(params.domain)
  
  if (!user) {
    notFound()
  }

  const [template, categoriesMap, collectionsMap, footerData, pageContent] = await Promise.all([
    getWebsiteTemplate(user.id),
    getCategoriesMap(user.id),
    getCollectionsMap(user.id),
    getFooterDataForUser(user.id),
    getPageContentForUser(user.id, 'terms'),
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

  const pageTitle = pageContent?.title || 'Terms of Service'
  const content = pageContent?.content || getDefaultTerms(user.shop_name || 'Our Store')

  return (
    <WebsiteLayout 
      user={user} 
      theme={theme}
      categories={categoriesArray}
      collections={collectionsArray}
    >
      <EditableStaticPage
        userId={user.id}
        slug="terms"
        initialTitle={pageTitle}
        initialContent={content}
        isDark={isDark}
      />
      <Footer 
        user={user}
        template={template ? { ...template, footer: footerData } : null}
        isDark={isDark}
      />
    </WebsiteLayout>
  )
}

function getDefaultTerms(shopName: string): string {
  return `Terms of Service for ${shopName}

Last updated: ${new Date().toLocaleDateString()}

1. Acceptance of Terms
By accessing and using this website, you accept and agree to be bound by the terms and provisions of this agreement.

2. Products and Services
All products displayed on this website are subject to availability. We reserve the right to discontinue any product at any time.

3. Pricing
All prices are subject to change without notice. We make every effort to ensure accuracy but errors may occur.

4. Orders and Payment
By placing an order, you warrant that you are legally capable of entering into binding contracts. Payment must be received before order processing.

5. Shipping and Delivery
Shipping times are estimates and not guaranteed. We are not responsible for delays caused by shipping carriers.

6. Returns and Refunds
Please refer to our Return Policy for information about returns and refunds.

7. Limitation of Liability
${shopName} shall not be liable for any indirect, incidental, special, or consequential damages.

8. Contact
For questions about these Terms, please contact us at our store.`
}
