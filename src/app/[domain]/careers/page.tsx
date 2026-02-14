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
    title: `Careers | ${user?.shop_name || 'Store'}`,
    description: `Join our team at ${user?.shop_name || 'our store'}. Explore career opportunities.`,
  }
}

export default async function CareersPage({ params }: PageProps) {
  const user = await getWebsiteByDomain(params.domain)
  if (!user) notFound()

  const [template, categoriesMap, collectionsMap, footerData, pageContent] = await Promise.all([
    getWebsiteTemplate(user.id),
    getCategoriesMap(user.id),
    getCollectionsMap(user.id),
    getFooterDataForUser(user.id),
    getPageContentForUser(user.id, 'careers'),
  ])

  if (!pageContent) notFound()

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

  const pageTitle = pageContent.title || 'Careers'
  const content = pageContent.content || getDefaultContent(user.shop_name || 'Our Store')

  return (
    <WebsiteLayout user={user} theme={theme} categories={categoriesArray} collections={collectionsArray} shopDomain={params.domain}>
      <EditableStaticPage
        userId={user.id}
        slug="careers"
        initialTitle={pageTitle}
        initialContent={content}
        isDark={isDark}
      />
      <Footer user={user} template={template ? { ...template, footer: footerData } : null} isDark={isDark} />
    </WebsiteLayout>
  )
}

function getDefaultContent(shopName: string | null): string {
  return `JOIN OUR TEAM

At ${shopName || 'our store'}, we're always looking for passionate individuals who share our love for beautiful jewelry and exceptional customer service.

WHY WORK WITH US?

• Be part of a creative and dynamic team
• Opportunity to work with exquisite jewelry
• Competitive compensation and benefits
• Growth opportunities within the company
• A supportive and inclusive work environment

CURRENT OPENINGS

We're currently looking for talented individuals in the following areas:

Sales Associates
• Help customers find their perfect piece
• Provide exceptional customer service
• Build lasting relationships with clients

Store Management
• Lead and motivate our retail team
• Drive sales and achieve targets
• Ensure smooth store operations

Digital Marketing
• Manage our online presence
• Create engaging content
• Drive e-commerce growth

HOW TO APPLY

If you're interested in joining our team, please send your resume and a brief cover letter to our email address. Include the position you're applying for in the subject line.

We review all applications and will contact qualified candidates for interviews.

Even if there isn't a current opening that matches your skills, we'd love to hear from you! Send us your resume, and we'll keep it on file for future opportunities.`
}
