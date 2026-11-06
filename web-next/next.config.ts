import type { NextConfig } from 'next';

// Mirrors the CSP in scripts/build-site.js. Store photos (eXtra, Nahdi) are hotlinked from the stores' own image servers.
// Keep the two lists in step when a store's image host is added.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://images.unsplash.com https://t3.gstatic.com https://media.extra.com https://www.nahdionline.com https://*.nahdionline.com",
  "media-src 'self' blob:",
  "connect-src 'self' https://*.supabase.co",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join('; ');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Product photos are hotlinked from Unsplash in demo mode and come from store feeds in production, so plain <img> tags are used.
  images: { unoptimized: true },
  // The root layout is app/[lang]/layout.tsx (so <html lang dir> follows the language); unmatched addresses use app/global-not-found.tsx.
  experimental: { globalNotFound: true },
  // Same security headers as the web-v2 build (scripts/build-site.js). Production only: the dev server needs eval for fast refresh.
  async headers() {
    if (process.env.NODE_ENV !== 'production') return [];
    return [{ source: '/:path*', headers: [
      { key: 'Content-Security-Policy', value: CSP },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(), payment=()' },
    ] }];
  },
  async redirects() {
    return [{ source: '/', destination: '/en/sa', permanent: false }];
  },
};

export default nextConfig;
