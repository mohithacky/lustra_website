import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface StorePreview {
  shop_name: string | null
  shop_domain: string | null
  logo_url: string | null
}

async function getAvailableStores(): Promise<StorePreview[]> {
  const { data, error } = await supabase
    .from('users')
    .select('shop_name, shop_domain, logo_url')
    .not('shop_domain', 'is', null)
    .not('shop_name', 'is', null)
    .limit(20)

  if (error) {
    console.error('Error fetching stores:', error)
    return []
  }

  return (data as StorePreview[]) || []
}

export default async function Home() {
  const stores = await getAvailableStores()

  return (
    <div className="min-h-screen bg-gradient-to-b from-offwhite-100 to-white flex items-center justify-center p-8">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-12">
          <h1 className="font-display text-5xl font-bold text-gray-900 mb-4">
            Lustra AI
          </h1>
          <p className="text-gray-600 text-xl mb-6">
            Beautiful jewelry websites powered by AI
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href={`https://lustrai.in/auth?returnUrl=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '/')}`}
              className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-semibold"
            >
              Sign In
            </a>
            <Link
              href="/profile"
              className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              My Profile
            </Link>
          </div>
        </div>

        {stores.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="font-semibold text-lg text-gray-900 mb-6 text-center">
              Explore Stores
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stores.map((store) => (
                <a
                  key={store.shop_domain}
                  href={`https://${store.shop_domain}.lustrai.in`}
                  className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-gold-400 hover:bg-gold-50 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-gold-100 flex items-center justify-center text-gold-600 font-display font-bold text-xl">
                    {store.shop_name?.charAt(0) || 'S'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-gold-600 transition-colors">
                      {store.shop_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {store.shop_domain}.lustrai.in
                    </p>
                  </div>
                  <span className="text-gold-500 group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </a>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <p className="text-gray-600">
              No stores available yet. Create your jewelry store with the Lustra AI app!
            </p>
          </div>
        )}

        <p className="text-center text-gray-500 text-sm mt-8">
          Powered by <span className="text-gold-500 font-semibold">Lustra AI</span>
        </p>
      </div>
    </div>
  )
}
 