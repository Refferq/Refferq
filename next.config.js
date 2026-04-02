/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone build for Docker deployments
  output: 'standalone',
  // Enable Turbopack (default in Next.js 16)
  turbopack: {
    root: __dirname,
  },
  // Keep webpack config for fallback compatibility
  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"]
    });
    return config;
  },
};

module.exports = nextConfig;
