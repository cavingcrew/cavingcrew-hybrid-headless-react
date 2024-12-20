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
	async rewrites() {
		return [
			{ source: "/trips", destination: "/trips" },
			{ source: "/trips/:slug", destination: "/trips/:slug" },
			{ source: "/categories", destination: "/categories" },
			{ source: "/categories/:slug", destination: "/categories/:slug" },
			{ source: "/:path*", destination: "/:path*" },
		];
	},
};

module.exports = nextConfig;
