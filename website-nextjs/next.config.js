/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force no caching for dynamic pages
  experimental: {
    // Disable ISR caching
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'phlccyxgyftspxnuzttf.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: 'https://api-5sqqk2n6ra-uc.a.run.app/:path*',
      },
    ]
  },
}

module.exports = nextConfig
 