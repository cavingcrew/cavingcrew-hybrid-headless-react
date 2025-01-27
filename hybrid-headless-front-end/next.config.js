const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ["localhost", "www.cavingcrew.com", "cavingcrew.com"],
  },
  experimental: {
    optimizeCss: {
      critters: {
        preload: 'media',
        preloadFonts: true,
      }
    },
    scrollRestoration: true,
  },
  transpilePackages: ["@tanstack/react-query"],
  webpack: (config) => {
    config.resolve.fallback = { fs: false };

    config.module.rules.push({
      test: /\.(js|jsx|ts|tsx)$/,
      exclude: /node_modules/,
      use: {
        loader: "babel-loader",
        options: {
          presets: ["next/babel"],
          plugins: [["@babel/plugin-transform-runtime", { regenerator: true }]],
        },
      },
    });

    return config;
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  pageExtensions: ["tsx", "ts"],
  reactStrictMode: true,
  poweredByHeader: false,
};

module.exports = nextConfig;
