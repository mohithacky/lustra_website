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
    title: `Warranty | ${user?.shop_name || 'Store'}`,
    description: `Warranty information for ${user?.shop_name || 'our store'}.`,
  }
}

export default async function WarrantyPage({ params }: PageProps) {
  const user = await getWebsiteByDomain(params.domain)
  if (!user) notFound()

  const [template, categoriesMap, collectionsMap, footerData] = await Promise.all([
    getWebsiteTemplate(user.id),
    getCategoriesMap(user.id),
    getCollectionsMap(user.id),
    getFooterDataForUser(user.id),
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
  const content = (user as unknown as { footer_warranty?: string })?.footer_warranty || getDefaultContent()

  return (
    <WebsiteLayout user={user} theme={theme} categories={categoriesArray} collections={collectionsArray}>
      <div className={`min-h-screen py-16 px-6 ${isDark ? 'bg-[#080808]' : 'bg-offwhite'}`}>
        <div className="max-w-3xl mx-auto">
          <h1 className={`font-display text-3xl md:text-4xl font-bold mb-8 ${isDark ? 'text-white' : 'text-black'}`}>
            Warranty
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

function getDefaultContent(): string {
  return `WARRANTY COVERAGE

We stand behind the quality of our products. All jewelry items come with our comprehensive warranty.

Standard Warranty Coverage
• Manufacturing defects: 1 year
• Stone settings: 6 months
• Plating (if applicable): 6 months

What's Covered
• Defects in materials and workmanship
• Stone fallout due to setting issues
• Clasp or mechanism failures
• Discoloration due to manufacturing defects

What's Not Covered
• Normal wear and tear
• Damage from accidents, misuse, or negligence
• Damage from exposure to chemicals, perfumes, or harsh cleaners
• Loss or theft
• Items modified by third parties
• Damage from improper storage

HOW TO CLAIM WARRANTY

1. Contact our customer service with your order details
2. Describe the issue with photos if possible
3. Our team will review and respond within 48 hours
4. If approved, ship the item to us for inspection
5. Repair or replacement will be processed within 7-10 business days

CARE RECOMMENDATIONS

To ensure your jewelry lasts:
• Remove jewelry before swimming, bathing, or exercising
• Apply perfumes and lotions before putting on jewelry
• Store in a cool, dry place, preferably in the provided box
• Clean gently with a soft, dry cloth
• Avoid contact with chemicals and harsh cleaners

AUTHENTICITY GUARANTEE

All our products are 100% genuine. Gold and diamond jewelry comes with:
• Hallmark certification
• Diamond certificates (for certified diamonds)
• Detailed invoice with product specifications

For any warranty-related questions, please contact our customer service team.`
}
