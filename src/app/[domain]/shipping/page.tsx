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
  return {
    title: `Shipping & Returns | ${user?.shop_name || 'Store'}`,
    description: `Shipping and return policies for ${user?.shop_name || 'our store'}.`,
  }
}

export default async function ShippingPage({ params }: PageProps) {
  const user = await getWebsiteByDomain(params.domain)
  if (!user) notFound()

  const [template, categoriesMap, collectionsMap, footerData, pageContent] = await Promise.all([
    getWebsiteTemplate(user.id),
    getCategoriesMap(user.id),
    getCollectionsMap(user.id),
    getFooterDataForUser(user.id),
    getPageContentForUser(user.id, 'shipping'),
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

  const pageTitle = pageContent?.title || 'Shipping & Returns'
  const content = pageContent?.content || getDefaultContent()

  return (
    <WebsiteLayout user={user} theme={theme} categories={categoriesArray} collections={collectionsArray}>
      <EditableStaticPage
        userId={user.id}
        slug="shipping"
        initialTitle={pageTitle}
        initialContent={content}
        isDark={isDark}
        canEdit={true}
      />
      <Footer user={user} template={template ? { ...template, footer: footerData } : null} isDark={isDark} />
    </WebsiteLayout>
  )
}

function getDefaultContent(): string {
  return `SHIPPING INFORMATION

Domestic Shipping
• Standard Delivery: 5-7 business days
• Express Delivery: 2-3 business days (additional charges apply)
• Free shipping on orders above ₹5,000

All orders are carefully packaged to ensure safe delivery. You will receive a tracking number once your order is dispatched.

Order Processing
• Orders placed before 2 PM are processed the same day
• Orders placed after 2 PM are processed the next business day
• Custom orders may take 7-10 business days for processing

RETURN POLICY

We want you to be completely satisfied with your purchase. If you're not happy with your order, we're here to help.

Return Eligibility
• Returns accepted within 7 days of delivery
• Item must be unused and in original packaging
• Item must have all tags and certificates intact
• Custom or personalized items cannot be returned

How to Return
1. Contact our customer service team
2. Receive a return authorization number
3. Pack the item securely in its original packaging
4. Ship to our return address

Refund Process
• Refunds are processed within 5-7 business days
• Amount will be credited to your original payment method
• Shipping charges are non-refundable

EXCHANGE POLICY

We offer free exchanges for:
• Different size of the same item
• Different color/variant of the same item

To request an exchange, please contact our customer service team within 7 days of receiving your order.`
}
