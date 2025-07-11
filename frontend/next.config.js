/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  images: {
    unoptimized: true
  },
  async rewrites() {
    // Only use local proxy in development
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://127.0.0.1:7071/api/:path*', // Proxy to backend in dev
        },
      ];
    }
    // In production, Azure Static Web Apps handles API routing automatically
    return [];
  },
};

module.exports = nextConfig; 