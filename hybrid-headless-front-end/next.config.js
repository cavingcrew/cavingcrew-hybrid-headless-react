/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Creates optimized production build
  basePath: '', // Empty as we're serving from root
  assetPrefix: '/_next/', // Matches our static serving path
  
  // Optimize image domains if needed
  images: {
    domains: ['localhost', 'your-production-domain.com'],
  },

  // Environment variables with defaults
  env: {
    NEXT_PUBLIC_WORDPRESS_API_URL: '/wp-json',
    NEXT_PUBLIC_WORDPRESS_URL: '/',
  },
}

module.exports = nextConfig
