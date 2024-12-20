const nextConfig = {
  output: "export",
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ["localhost", "www.cavingcrew.com", "cavingcrew.com"],
    unoptimized: true,
  },
  trailingSlash: true,
  // Add route priority
  async rewrites() {
    return [
      // Existing routes take precedence
      { source: '/trips', destination: '/trips' },
      { source: '/trips/:slug', destination: '/trips/:slug' },
      { source: '/categories', destination: '/categories' },
      { source: '/categories/:slug', destination: '/categories/:slug' },
      // Catch-all as fallback
      { source: '/:path*', destination: '/:path*' }
    ];
  }
};

module.exports = nextConfig;
