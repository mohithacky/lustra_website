import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWebsiteByDomain, getWebsiteTemplate, getCategoriesMap, getCollectionsMap } from '@/lib/supabase'
import { getFooterDataForUser, getPageContentForUser } from '@/lib/supabase-new-architecture'
import WebsiteLayout from '@/components/layout/WebsiteLayout'
import Footer from '@/components/sections/Footer'

interface PageProps {
  params: { domain: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const user = await getWebsiteByDomain(params.domain)
  return {
    title: `Press & Media | ${user?.shop_name || 'Store'}`,
    description: `Press and media information for ${user?.shop_name || 'our store'}.`,
  }
}

export default async function PressPage({ params }: PageProps) {
  const user = await getWebsiteByDomain(params.domain)
  if (!user) notFound()

  const [template, categoriesMap, collectionsMap, footerData, pageContent] = await Promise.all([
    getWebsiteTemplate(user.id),
    getCategoriesMap(user.id),
    getCollectionsMap(user.id),
    getFooterDataForUser(user.id),
    getPageContentForUser(user.id, 'press'),
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

  const pageTitle = pageContent?.title || 'Press'
  const content = pageContent?.content || getDefaultContent(user.shop_name)

  return (
    <WebsiteLayout user={user} theme={theme} categories={categoriesArray} collections={collectionsArray}>
      <div className={`min-h-screen py-16 px-6 ${isDark ? 'bg-[#080808]' : 'bg-offwhite'}`}>
        <div className="max-w-3xl mx-auto">
          <h1 className={`font-display text-3xl md:text-4xl font-bold mb-8 ${isDark ? 'text-white' : 'text-black'}`}>
            {pageTitle}
          </h1>
          <div className={`whitespace-pre-wrap leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {content}
          </div>
        </div>
      </div>
      <Footer user={user} template={template ? { ...template, footer: footerData } : null} isDark={isDark} />
    </WebsiteLayout>
  )
}

function getDefaultContent(shopName: string | null): string {
  return `PRESS & MEDIA

Welcome to the ${shopName || 'our'} press page. Here you'll find information for media inquiries and press coverage.

ABOUT US

${shopName || 'Our store'} is a premium jewelry destination offering exquisite pieces crafted with passion and precision. We specialize in creating timeless jewelry that celebrates life's special moments.

MEDIA CONTACT

For press inquiries, interviews, or media requests, please contact us through our main contact page. We aim to respond to all media inquiries within 48 hours.

PRESS RESOURCES

For media professionals, we can provide:
• High-resolution product images
• Brand logos and assets
• Press releases
• Company fact sheet
• Executive bios

BRAND GUIDELINES

When featuring ${shopName || 'our brand'} in your publication:
• Please use our official brand name as specified
• Use only approved logos and images
• Link to our official website when publishing online
• Contact us for quote approval before publication

RECENT COVERAGE

We're proud to have been featured in various publications and media outlets. For a complete list of our media coverage or to request press materials, please reach out to us.

COLLABORATION OPPORTUNITIES

We're open to collaborations with:
• Fashion and lifestyle publications
• Influencers and content creators
• Event organizers
• Brand partnerships

If you're interested in collaborating with us, we'd love to hear from you!`
}
