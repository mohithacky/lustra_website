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
  
  if (!user) {
    return { title: 'Return & Refund Policy' }
  }

  return {
    title: `Return & Refund Policy - ${user.shop_name || 'Jewelry Store'}`,
    description: `Return and Refund Policy for ${user.shop_name}`,
  }
}

export default async function RefundPage({ params }: PageProps) {
  const user = await getWebsiteByDomain(params.domain)
  
  if (!user) {
    notFound()
  }

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

  // Get refund policy content from user data or use default
  const refundContent = (user as unknown as { refund_policy?: string }).refund_policy || getDefaultRefundPolicy(user.shop_name || 'Our Store')

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
            Return & Refund Policy
          </h1>
          <div className="prose prose-lg max-w-none">
            <div 
              className={isDark ? 'text-gray-300' : 'text-gray-700'}
              style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}
            >
              {refundContent}
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

function getDefaultRefundPolicy(shopName: string): string {
  return `Return & Refund Policy for ${shopName}

Last updated: ${new Date().toLocaleDateString()}

1. Return Eligibility
Items may be returned within 7 days of delivery if they meet the following conditions:
- Item is unused and in original condition
- Item is in original packaging with all tags attached
- Proof of purchase is provided

2. Non-Returnable Items
The following items cannot be returned:
- Custom or personalized jewelry
- Items that have been resized or altered
- Sale or clearance items (unless defective)

3. Return Process
To initiate a return:
- Contact our customer service team
- Provide your order number and reason for return
- Wait for return authorization and shipping instructions

4. Refund Processing
- Refunds will be processed within 7-10 business days of receiving the returned item
- Refunds will be issued to the original payment method
- Shipping costs are non-refundable unless the return is due to our error

5. Exchanges
We are happy to exchange items for a different size or style, subject to availability.

6. Damaged or Defective Items
If you receive a damaged or defective item, please contact us immediately with photos of the damage.

7. Contact Us
For questions about returns, please contact us at our store.`
}
