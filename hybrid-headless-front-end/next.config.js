const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ["localhost", "www.cavingcrew.com", "cavingcrew.com"],
    unoptimized: true,
  },
  experimental: {
    optimizeCss: {
      critters: {
        preload: "media",
        preloadFonts: true,
      },
    },
    scrollRestoration: true,
  },
  transpilePackages: ["@tanstack/react-query"],
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    return config;
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  output: "export",
  trailingSlash: true,
};

module.exports = nextConfig;
