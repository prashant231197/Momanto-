/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'images.unsplash.com'],
    unoptimized: true
  },
  // ✅ REMOVED rewrites() — it was proxying all /api/* to localhost:5000
  // which no longer exists. Express now serves API routes directly on port 3000.
};

module.exports = nextConfig;
