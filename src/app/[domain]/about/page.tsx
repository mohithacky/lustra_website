import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWebsiteByDomain, getWebsiteTemplate, getCategoriesMap, getCollectionsMap, getFooterData } from '@/lib/supabase'
import WebsiteLayout from '@/components/layout/WebsiteLayout'
import Footer from '@/components/sections/Footer'

// Enable ISR - revalidate every 24 hours (static content)
export const revalidate = 86400 // 24 hours - about page cached at edge

interface PageProps {
  params: { domain: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const user = await getWebsiteByDomain(params.domain)
  
  if (!user) {
    return { title: 'About Us' }
  }

  return {
    title: `About Us - ${user.shop_name || 'Jewelry Store'}`,
    description: `About ${user.shop_name}`,
  }
}

export default async function AboutPage({ params }: PageProps) {
  const startTime = Date.now()
  console.log(`[ISR] 📄 ABOUT PAGE | Domain: ${params.domain} | Cache: 86400s (24h) | ${new Date().toISOString()}`)

  const user = await getWebsiteByDomain(params.domain)
  
  if (!user) {
    console.log(`[ISR] ❌ User not found: ${params.domain}`)
    notFound()
  }
  console.log(`[ISR] ✅ User: ${user.shop_name} (${user.id})`)

  const [template, categoriesMap, collectionsMap, footerData] = await Promise.all([
    getWebsiteTemplate(user.id),
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

  // Get about content from user data or use default
  const aboutContent = (user as unknown as { about_us?: string }).about_us || getDefaultAbout(user.shop_name || 'Our Store')

  return (
    <WebsiteLayout 
      user={user} 
      theme={theme}
      categories={categoriesArray}
      collections={collectionsArray}
      shopDomain={params.domain}
    >
      <div className={isDark ? 'bg-[#080808] text-white' : 'bg-white text-black'}>
        <div className="max-w-4xl mx-auto px-6 py-12">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-8">
            About Us
          </h1>
          <div className="prose prose-lg max-w-none">
            <div 
              className={isDark ? 'text-gray-300' : 'text-gray-700'}
              style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}
            >
              {aboutContent}
            </div>
          </div>
        </div>
      </div>
      <Footer 
        user={user}
        template={template ? { ...template, footer: footerData } : null}
        isDark={isDark}
      />
    </WebsiteLayout>
  )
}

function getDefaultAbout(shopName: string): string {
  return `Welcome to ${shopName}

We are passionate about bringing you the finest jewelry pieces that celebrate life's most precious moments.

Our Story
${shopName} was founded with a simple mission: to create beautiful, high-quality jewelry that our customers will treasure for a lifetime. Every piece in our collection is carefully curated and crafted with attention to detail.

Our Commitment
- Quality: We use only the finest materials and work with skilled artisans
- Design: Our pieces blend timeless elegance with contemporary style
- Service: Your satisfaction is our top priority

Visit us today and discover the perfect piece that tells your unique story.`
}
