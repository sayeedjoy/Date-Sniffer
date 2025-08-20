/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  trailingSlash: true,
  assetPrefix: './',
  images: { unoptimized: true },
};

export default nextConfig;


