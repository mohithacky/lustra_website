import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWebsiteByDomain, getWebsiteTemplate, getCategoriesMap, getCollectionsMap, getStoreInfoForUser } from '@/lib/supabase'
import { getFooterDataForUser } from '@/lib/supabase-new-architecture'
import WebsiteLayout from '@/components/layout/WebsiteLayout'
import Footer from '@/components/sections/Footer'
import ContactForm from '@/components/sections/ContactForm'
import { MapPin, Phone, Mail, Instagram, Facebook } from 'lucide-react'

// Enable ISR - revalidate every 24 hours (static content)
export const revalidate = 86400 // 24 hours - contact page cached at edge

interface PageProps {
  params: { domain: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const user = await getWebsiteByDomain(params.domain)
  return {
    title: `Contact Us | ${user?.shop_name || 'Store'}`,
    description: `Get in touch with ${user?.shop_name || 'us'}. We'd love to hear from you.`,
  }
}

export default async function ContactPage({ params }: PageProps) {
  const startTime = Date.now()
  console.log(`[ISR] 📄 CONTACT PAGE | Domain: ${params.domain} | Cache: 86400s (24h) | ${new Date().toISOString()}`)

  const user = await getWebsiteByDomain(params.domain)
  if (!user) { console.log(`[ISR] ❌ User not found: ${params.domain}`); notFound() }
  console.log(`[ISR] ✅ User: ${user.shop_name} (${user.id})`)

  const [template, categoriesMap, collectionsMap, footerData, storeInfo] = await Promise.all([
    getWebsiteTemplate(user.id),
    getCategoriesMap(user.id),
    getCollectionsMap(user.id),
    getFooterDataForUser(user.id),
    getStoreInfoForUser(user.id),
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

  // Get facebook_id from store_info
  const facebookId = storeInfo?.facebook_id || null

  // Merge user data with store_info for footer
  const userWithSocial = { ...user, facebook_id: facebookId }

  return (
    <WebsiteLayout user={user} theme={theme} categories={categoriesArray} collections={collectionsArray} shopDomain={params.domain}>
      <div className={`min-h-screen py-16 px-6 ${isDark ? 'bg-[#080808]' : 'bg-offwhite'}`}>
        <div className="max-w-4xl mx-auto">
          <h1 className={`font-display text-3xl md:text-4xl font-bold mb-4 text-center ${isDark ? 'text-white' : 'text-black'}`}>
            Contact Us
          </h1>
          <p className={`text-center mb-12 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            We&apos;d love to hear from you. Get in touch with us.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Info */}
            <div className={`rounded-2xl p-8 ${isDark ? 'bg-zinc-900' : 'bg-white shadow-lg'}`}>
              <h2 className={`font-display text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-black'}`}>
                Get In Touch
              </h2>
              
              <div className="space-y-6">
                {user.shop_address && (
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gold-500/10 rounded-xl">
                      <MapPin className="w-6 h-6 text-gold-500" />
                    </div>
                    <div>
                      <p className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-black'}`}>Visit Us</p>
                      <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{user.shop_address}</p>
                    </div>
                  </div>
                )}

                {user.phone_number && (
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gold-500/10 rounded-xl">
                      <Phone className="w-6 h-6 text-gold-500" />
                    </div>
                    <div>
                      <p className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-black'}`}>Call Us</p>
                      <a href={`tel:${user.phone_number}`} className="text-gold-500 hover:underline">
                        {user.phone_number}
                      </a>
                    </div>
                  </div>
                )}

                {user.email && (
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gold-500/10 rounded-xl">
                      <Mail className="w-6 h-6 text-gold-500" />
                    </div>
                    <div>
                      <p className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-black'}`}>Email Us</p>
                      <a href={`mailto:${user.email}`} className="text-gold-500 hover:underline">
                        {user.email}
                      </a>
                    </div>
                  </div>
                )}

                {user.instagram_id && (
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gold-500/10 rounded-xl">
                      <Instagram className="w-6 h-6 text-gold-500" />
                    </div>
                    <div>
                      <p className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-black'}`}>Follow Us on Instagram</p>
                      <a href={`https://instagram.com/${user.instagram_id}`} target="_blank" rel="noopener noreferrer" className="text-gold-500 hover:underline">
                        @{user.instagram_id}
                      </a>
                    </div>
                  </div>
                )}

                {facebookId && (
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gold-500/10 rounded-xl">
                      <Facebook className="w-6 h-6 text-gold-500" />
                    </div>
                    <div>
                      <p className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-black'}`}>Follow Us on Facebook</p>
                      <a href={`https://facebook.com/${facebookId}`} target="_blank" rel="noopener noreferrer" className="text-gold-500 hover:underline">
                        {facebookId}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Message Form */}
            <ContactForm isDark={isDark} userId={user.id} />
          </div>
        </div>
      </div>
      <Footer user={userWithSocial} template={template ? { ...template, footer: footerData } : null} isDark={isDark} />
    </WebsiteLayout>
  )
}
