import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWebsiteByDomain, getWebsiteTemplate, getCategoriesMap, getCollectionsMap } from '@/lib/supabase'
import { getFooterDataForUser, getPageContentForUser } from '@/lib/supabase-new-architecture'
import WebsiteLayout from '@/components/layout/WebsiteLayout'
import Footer from '@/components/sections/Footer'
import EditableStaticPage from '@/components/pages/EditableStaticPage'

export const revalidate = 0

interface PageProps {
  params: { domain: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const user = await getWebsiteByDomain(params.domain)
  return {
    title: `FAQs | ${user?.shop_name || 'Store'}`,
    description: `Frequently asked questions about ${user?.shop_name || 'our store'}.`,
  }
}

export default async function FAQsPage({ params }: PageProps) {
  const user = await getWebsiteByDomain(params.domain)
  if (!user) notFound()

  const [template, categoriesMap, collectionsMap, footerData, pageContent] = await Promise.all([
    getWebsiteTemplate(user.id),
    getCategoriesMap(user.id),
    getCollectionsMap(user.id),
    getFooterDataForUser(user.id),
    getPageContentForUser(user.id, 'faqs'),
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

  const pageTitle = pageContent?.title || 'FAQs'
  const content = pageContent?.content || getDefaultFAQs()

  return (
    <WebsiteLayout user={user} theme={theme} categories={categoriesArray} collections={collectionsArray} shopDomain={params.domain}>
      <EditableStaticPage
        userId={user.id}
        slug="faqs"
        initialTitle={pageTitle}
        initialContent={content}
        isDark={isDark}
      />
      <Footer user={user} template={template ? { ...template, footer: footerData } : null} isDark={isDark} />
    </WebsiteLayout>
  )
}

function getDefaultFAQs(): string {
  return `Q: What payment methods do you accept?
A: We accept all major credit cards, debit cards, UPI, and net banking. Cash on delivery is also available for select locations.

Q: How long does shipping take?
A: Standard shipping takes 5-7 business days. Express shipping (2-3 business days) is available at an additional cost.

Q: Do you offer international shipping?
A: Currently, we ship within India only. We're working on expanding our shipping options.

Q: What is your return policy?
A: We offer a 7-day return policy for unused items in their original packaging. Please see our Returns page for full details.

Q: Are your products genuine?
A: Yes, all our products are 100% genuine and come with authenticity certificates where applicable.

Q: How do I track my order?
A: Once your order ships, you'll receive a tracking number via email and SMS. You can use this to track your delivery.

Q: Do you offer gift wrapping?
A: Yes! We offer complimentary gift wrapping for all orders. Just mention it in the order notes.

Q: How do I care for my jewelry?
A: Store your jewelry in a cool, dry place. Avoid exposure to perfumes, lotions, and water. Clean gently with a soft cloth.

Q: Can I customize my order?
A: Yes, we offer customization options for select products. Please contact us to discuss your requirements.

Q: How can I contact customer support?
A: You can reach us via phone, email, or WhatsApp. Visit our Contact Us page for details.`
}
