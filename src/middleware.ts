import { NextRequest, NextResponse } from 'next/server'

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}

export function middleware(request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get('host') || ''
  
  // Extract subdomain from hostname
  // Production: mohitjewellers.lustrai.in -> mohitjewellers
  // Local dev: localhost:3000 -> use path-based routing
  const shopDomain = extractSubdomain(hostname)
  
  console.log(`[Middleware] hostname: ${hostname}, shopDomain: ${shopDomain}, path: ${url.pathname}`)
  
  // If we have a subdomain and we're at the root, rewrite to the dynamic store page
  if (shopDomain) {
    // Rewrite to /[domain] page with the subdomain
    url.pathname = `/${shopDomain}${url.pathname === '/' ? '' : url.pathname}`
    return NextResponse.rewrite(url)
  }
  
  // No subdomain - continue with normal routing (path-based)
  return NextResponse.next()
}

function extractSubdomain(hostname: string): string | null {
  // Remove port if present
  const host = hostname.split(':')[0]
  
  // Skip for localhost development
  if (host === 'localhost' || host === '127.0.0.1') {
    return null
  }
  
  // Split hostname into parts
  const parts = host.split('.')
  
  // For production: subdomain.lustrai.in (3 parts)
  // For custom domains: subdomain.example.com (3 parts)
  // Skip www subdomain
  if (parts.length >= 3) {
    const subdomain = parts[0]
    
    // Skip common non-store subdomains
    if (subdomain === 'www' || subdomain === 'api' || subdomain === 'admin') {
      return null
    }
    
    return subdomain
  }
  
  // For 2-part domains like lustrai.in (main site), no subdomain
  return null
}
