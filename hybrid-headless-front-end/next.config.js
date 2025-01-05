const nextConfig = {
	eslint: {
		ignoreDuringBuilds: true,
	},
	images: {
		domains: ["localhost", "www.cavingcrew.com", "cavingcrew.com"],
	},
	transpilePackages: ['@tanstack/react-query'],
	webpack: (config) => {
		config.resolve.fallback = { fs: false };
		return config;
	},
};

module.exports = nextConfig;
