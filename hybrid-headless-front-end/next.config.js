const nextConfig = {
    output: 'export',
    eslint: {
        ignoreDuringBuilds: true,
    },
    images: {
        domains: ["localhost", "www.cavingcrew.com", "cavingcrew.com"],
        unoptimized: true,
    },
    trailingSlash: true
};

module.exports = nextConfig;
