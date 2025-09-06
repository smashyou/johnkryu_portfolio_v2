/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["localhost"],
  },
  // Enable static export for deployment
  output: "export",
  trailingSlash: true,
  basePath: "",
  assetPrefix: "",
};

module.exports = nextConfig;
