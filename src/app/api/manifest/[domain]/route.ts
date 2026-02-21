import { NextRequest, NextResponse } from 'next/server'
import { getWebsiteByDomain } from '@/lib/supabase-new-architecture'

/**
 * GET /api/manifest/[domain]
 * Generates a dynamic Web App Manifest for each shop subdomain.
 * This ensures "Add to Home Screen" saves the specific shop URL (e.g., ashmitjewellers.lustrai.in)
 * and NOT the parent domain (lustrai.in).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { domain: string } }
) {
  const domain = params.domain

  // Fetch shop data for this domain
  let shopName = domain
  let shopDescription = `Shop at ${domain}`
  let iconUrl: string | null = null
  let themeColor = '#C5A572'
  let backgroundColor = '#F8F7F4'

  try {
    const user = await getWebsiteByDomain(domain)
    if (user) {
      shopName = user.shop_name || domain
      shopDescription = `Discover beautiful jewelry at ${shopName}`
      iconUrl = user.logo_url
    }
  } catch (error) {
    console.error(`[Manifest] Error fetching data for domain ${domain}:`, error)
  }

  // Build the start_url to point to the subdomain
  const isProduction = process.env.NODE_ENV === 'production'
  const baseUrl = isProduction
    ? `https://${domain}.lustrai.in`
    : `http://localhost:3000/${domain}`

  // Build icon entries
  const icons: any[] = []
  if (iconUrl) {
    // Use the shop's logo as the PWA icon
    const logoSrc = iconUrl.startsWith('http')
      ? iconUrl
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${iconUrl}`

    icons.push(
      {
        src: logoSrc,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: logoSrc,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      }
    )
  } else {
    // Fallback to default icons
    icons.push(
      {
        src: '/icons/Icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/Icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      }
    )
  }

  const manifest = {
    name: shopName,
    short_name: shopName.length > 12 ? shopName.substring(0, 12) : shopName,
    description: shopDescription,
    start_url: baseUrl + '/',
    scope: baseUrl + '/',
    display: 'standalone',
    orientation: 'portrait',
    theme_color: themeColor,
    background_color: backgroundColor,
    icons,
    categories: ['shopping', 'lifestyle'],
  }

  return new NextResponse(JSON.stringify(manifest), {
    status: 200,
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  })
}
