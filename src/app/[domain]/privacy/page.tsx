import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWebsiteByDomain, getWebsiteTemplate, getCategoriesMap, getCollectionsMap } from '@/lib/supabase'
import WebsiteLayout from '@/components/layout/WebsiteLayout'
import Footer from '@/components/sections/Footer'
import { getFooterData } from '@/lib/supabase'

interface PageProps {
  params: { domain: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const user = await getWebsiteByDomain(params.domain)
  
  if (!user) {
    return { title: 'Privacy Policy' }
  }

  return {
    title: `Privacy Policy - ${user.shop_name || 'Jewelry Store'}`,
    description: `Privacy Policy for ${user.shop_name}`,
  }
}

export default async function PrivacyPage({ params }: PageProps) {
  const user = await getWebsiteByDomain(params.domain)
  
  if (!user) {
    notFound()
  }

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

  // Get privacy policy content from user data or use default
  const privacyContent = (user as unknown as { privacy_policy?: string }).privacy_policy || getDefaultPrivacyPolicy(user.shop_name || 'Our Store')

  return (
    <WebsiteLayout 
      user={user} 
      theme={theme}
      categories={categoriesArray}
      collections={collectionsArray}
    >
      <div className={isDark ? 'bg-[#080808] text-white' : 'bg-white text-black'}>
        <div className="max-w-4xl mx-auto px-6 py-12">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-8">
            Privacy Policy
          </h1>
          <div className="prose prose-lg max-w-none">
            <div 
              className={isDark ? 'text-gray-300' : 'text-gray-700'}
              style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}
            >
              {privacyContent}
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

function getDefaultPrivacyPolicy(shopName: string): string {
  return `Privacy Policy for ${shopName}

Last updated: ${new Date().toLocaleDateString()}

1. Information We Collect
We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support.

2. How We Use Your Information
We use the information we collect to:
- Process transactions and send related information
- Send promotional communications (with your consent)
- Respond to your comments and questions
- Provide customer service

3. Information Sharing
We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.

4. Data Security
We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

5. Your Rights
You have the right to access, update, or delete your personal information. Contact us to exercise these rights.

6. Contact Us
If you have questions about this Privacy Policy, please contact us at our store.`
}
