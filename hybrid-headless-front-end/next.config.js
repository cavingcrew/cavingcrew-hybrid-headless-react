const path = require("path"); // Need to require path module

const nextConfig = {
	eslint: {
		ignoreDuringBuilds: true,
	},
	images: {
		domains: ["localhost", "www.cavingcrew.com", "cavingcrew.com"],
	},
	transpilePackages: ["@tanstack/react-query"],
	webpack: (config) => {
		// Add path aliases while preserving existing ones
		config.resolve.alias = {
			...config.resolve.alias, // Keep existing aliases
			"@": path.resolve(__dirname), // Add new alias
		};

		// Maintain existing webpack config for fs polyfill
		config.resolve.fallback = { fs: false };

		return config;
	},
};

module.exports = nextConfig;
