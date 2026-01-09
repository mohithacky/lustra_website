import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWebsiteByDomain, getWebsiteTemplate, getCategoriesMap, getCollectionsMap } from '@/lib/supabase'
import { getFooterDataForUser, getPageContentForUser } from '@/lib/supabase-new-architecture'
import WebsiteLayout from '@/components/layout/WebsiteLayout'
import Footer from '@/components/sections/Footer'
import Image from 'next/image'
import { getImageUrl } from '@/lib/utils'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'

interface PageProps {
  params: { domain: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const user = await getWebsiteByDomain(params.domain)
  return {
    title: `Our Shop | ${user?.shop_name || 'Store'}`,
    description: `Visit ${user?.shop_name || 'our store'} - Find our location and contact details.`,
  }
}

export default async function OurShopPage({ params }: PageProps) {
  const user = await getWebsiteByDomain(params.domain)
  if (!user) notFound()

  const [template, categoriesMap, collectionsMap, footerData, pageContent] = await Promise.all([
    getWebsiteTemplate(user.id),
    getCategoriesMap(user.id),
    getCollectionsMap(user.id),
    getFooterDataForUser(user.id),
    getPageContentForUser(user.id, 'our-shop'),
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

  const pageTitle = pageContent?.title || 'Our Shop'
  const content = pageContent?.content

  return (
    <WebsiteLayout user={user} theme={theme} categories={categoriesArray} collections={collectionsArray}>
      <div className={`min-h-screen py-16 px-6 ${isDark ? 'bg-[#080808]' : 'bg-offwhite'}`}>
        <div className="max-w-4xl mx-auto">
          <h1 className={`font-display text-3xl md:text-4xl font-bold mb-8 text-center ${isDark ? 'text-white' : 'text-black'}`}>
            {pageTitle}
          </h1>

          {/* Shop Image */}
          {user.logo_url && (
            <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden mb-8">
              <Image src={getImageUrl(user.logo_url)} alt={user.shop_name || 'Shop'} fill className="object-cover" />
            </div>
          )}

          {/* Shop Info */}
          <div className={`rounded-2xl p-8 ${isDark ? 'bg-zinc-900' : 'bg-white shadow-lg'}`}>
            <h2 className={`font-display text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-black'}`}>
              {user.shop_name}
            </h2>

            <div className="space-y-4">
              {user.shop_address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gold-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>Address</p>
                    <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{user.shop_address}</p>
                  </div>
                </div>
              )}

              {user.phone_number && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gold-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>Phone</p>
                    <a href={`tel:${user.phone_number}`} className="text-gold-500 hover:underline">
                      {user.phone_number}
                    </a>
                  </div>
                </div>
              )}

              {user.email && (
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gold-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>Email</p>
                    <a href={`mailto:${user.email}`} className="text-gold-500 hover:underline">
                      {user.email}
                    </a>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gold-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>Hours</p>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Mon - Sat: 10:00 AM - 8:00 PM</p>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Sunday: 11:00 AM - 6:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer user={user} template={template ? { ...template, footer: footerData } : null} isDark={isDark} />
    </WebsiteLayout>
  )
}
