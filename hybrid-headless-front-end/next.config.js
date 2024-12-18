const nextConfig = {
	output: "standalone",
	eslint: {
		ignoreDuringBuilds: true,
	},
	images: {
		domains: ["localhost", "www.cavingcrew.com", "cavingcrew.com"],
		unoptimized: true,
	},
	experimental: {
		outputFileTracingRoot:
			process.env.NODE_ENV === "development" ? undefined : process.cwd(),
	},
	webpack: (config, { dev, isServer }) => {
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
