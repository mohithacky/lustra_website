import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWebsiteByDomain, getWebsiteTemplate, getCategoriesMap, getCollectionsMap } from '@/lib/supabase'
import { getFooterDataForUser } from '@/lib/supabase-new-architecture'
import WebsiteLayout from '@/components/layout/WebsiteLayout'
import Footer from '@/components/sections/Footer'
import { MapPin, Phone, Mail, Instagram } from 'lucide-react'

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

  return (
    <WebsiteLayout user={user} theme={theme} categories={categoriesArray} collections={collectionsArray}>
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
                      <p className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-black'}`}>Follow Us</p>
                      <a href={`https://instagram.com/${user.instagram_id}`} target="_blank" rel="noopener noreferrer" className="text-gold-500 hover:underline">
                        @{user.instagram_id}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Message Form */}
            <div className={`rounded-2xl p-8 ${isDark ? 'bg-zinc-900' : 'bg-white shadow-lg'}`}>
              <h2 className={`font-display text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-black'}`}>
                Send a Message
              </h2>
              <form className="space-y-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  className={`w-full px-4 py-3 rounded-xl border outline-none focus:border-gold-500 ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-gray-50 border-gray-200 text-black'}`}
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  className={`w-full px-4 py-3 rounded-xl border outline-none focus:border-gold-500 ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-gray-50 border-gray-200 text-black'}`}
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  className={`w-full px-4 py-3 rounded-xl border outline-none focus:border-gold-500 ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-gray-50 border-gray-200 text-black'}`}
                />
                <textarea
                  placeholder="Your Message"
                  rows={4}
                  className={`w-full px-4 py-3 rounded-xl border outline-none focus:border-gold-500 resize-none ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-gray-50 border-gray-200 text-black'}`}
                />
                <button type="submit" className="w-full bg-gold-500 hover:bg-gold-600 text-white py-3 rounded-xl font-semibold transition-colors">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer user={user} template={template ? { ...template, footer: footerData } : null} isDark={isDark} />
    </WebsiteLayout>
  )
}
