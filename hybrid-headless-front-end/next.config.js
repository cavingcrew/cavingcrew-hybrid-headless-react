/** @type {import('next').NextConfig} */
const nextConfig = {
	output: "standalone",
	basePath: "",

	// Configure image domains
	images: {
		domains: ["localhost", "www.cavingcrew.com", "cavingcrew.com"],
		unoptimized: true,
	},

	// Optimize builds
	compress: true,
	poweredByHeader: false,

	// Handle static file generation
	generateBuildId: async () => {
		return `build-${Date.now()}`;
	},

	// Add CSS modules support
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
