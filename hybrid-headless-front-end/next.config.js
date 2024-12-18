/** @type {import('next').NextConfig} */
const nextConfig = {
	output: "standalone",
	basePath: "",
	assetPrefix: "/_next/",

	// Optimize image domains if needed
	images: {
		domains: ["localhost", "your-production-domain.com"],
		unoptimized: true, // Since we're serving through WordPress
	},

	// Environment variables are fixed
	env: {
		NEXT_PUBLIC_WORDPRESS_API_URL: "/wp-json",
		NEXT_PUBLIC_WORDPRESS_URL: "/",
	},

	// Optimize builds
	compress: true,
	poweredByHeader: false,

	// Handle static file generation
	generateBuildId: async () => {
		return `build-${Date.now()}`;
	},

	// Webpack optimizations
	webpack: (config, { dev, isServer }) => {
		// Only enable these optimizations in production
		if (!dev) {
			config.optimization = {
				...config.optimization,
				minimize: true,
				splitChunks: {
					chunks: "all",
					minSize: 20000,
					maxSize: 244000,
				},
			};
		}
		return config;
	},
};

module.exports = nextConfig;
