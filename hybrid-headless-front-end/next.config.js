const nextConfig = {
	output: "standalone",
	images: {
		domains: ["localhost", "www.cavingcrew.com", "cavingcrew.com"],
		unoptimized: true,
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
