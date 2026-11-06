import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Product photos are hotlinked from Unsplash in demo mode and come from store feeds in production, so plain <img> tags are used.
  images: { unoptimized: true },
  // The root layout is app/[lang]/layout.tsx (so <html lang dir> follows the language); unmatched addresses use app/global-not-found.tsx.
  experimental: { globalNotFound: true },
  async redirects() {
    return [{ source: '/', destination: '/en/sa', permanent: false }];
  },
};

export default nextConfig;
