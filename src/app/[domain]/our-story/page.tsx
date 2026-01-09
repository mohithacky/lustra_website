import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWebsiteByDomain, getWebsiteTemplate, getCategoriesMap, getCollectionsMap } from '@/lib/supabase'
import { getFooterDataForUser } from '@/lib/supabase-new-architecture'
import WebsiteLayout from '@/components/layout/WebsiteLayout'
import Footer from '@/components/sections/Footer'

interface PageProps {
  params: { domain: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const user = await getWebsiteByDomain(params.domain)
  return {
    title: `Our Story | ${user?.shop_name || 'Store'}`,
    description: `Learn about the story behind ${user?.shop_name || 'our store'}.`,
  }
}

export default async function OurStoryPage({ params }: PageProps) {
  const user = await getWebsiteByDomain(params.domain)
  if (!user) notFound()

  const [template, categoriesMap, collectionsMap, footerData] = await Promise.all([
    getWebsiteTemplate(user.id),
    getCategoriesMap(user.id),
    getCollectionsMap(user.id),
    getFooterDataForUser(user.id),
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

  // Get content from user data
  const content = (user as unknown as { footer_our_story?: string })?.footer_our_story || getDefaultContent(user.shop_name)

  return (
    <WebsiteLayout
      user={user}
      theme={theme}
      categories={categoriesArray}
      collections={collectionsArray}
    >
      <div className={`min-h-screen py-16 px-6 ${isDark ? 'bg-[#080808]' : 'bg-offwhite'}`}>
        <div className="max-w-3xl mx-auto">
          <h1 className={`font-display text-3xl md:text-4xl font-bold mb-8 ${isDark ? 'text-white' : 'text-black'}`}>
            Our Story
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
  return `Welcome to ${shopName || 'our store'}

Every piece of jewelry tells a story, and so do we.

Our journey began with a simple passion: to create beautiful, meaningful jewelry that celebrates life's special moments. What started as a small dream has grown into a beloved destination for those seeking quality craftsmanship and timeless designs.

We believe that jewelry is more than just an accessory – it's an expression of your unique style, a keeper of memories, and a treasure to be passed down through generations.

Our commitment to excellence drives everything we do:
• Carefully sourced materials
• Expert craftsmanship
• Attention to every detail
• Exceptional customer service

Thank you for being part of our story. We're honored to help you create yours.`
}
