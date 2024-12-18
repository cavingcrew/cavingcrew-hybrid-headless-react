/** @type {import('next').NextConfig} */
const nextConfig = {
	output: "standalone",

	// Configure image domains
	images: {
		domains: ["localhost", "www.cavingcrew.com", "cavingcrew.com"],
		unoptimized: true,
	},

	// Optimize builds
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

		// Handle Mantine packages
		if (!isServer) {
			config.resolve.alias = {
				...config.resolve.alias,
				"@mantine/core": "@mantine/core/esm",
				"@mantine/hooks": "@mantine/hooks/esm",
			};
		}

		return config;
	},
};

module.exports = nextConfig;
