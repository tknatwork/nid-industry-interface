import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,

  // Standalone output for production deployment.
  // Vercel for prototype, self-hosted Docker for production (Phase 6.13.3 + 6.13.8).
  output: 'standalone',

  experimental: {
    // RSC + Server Actions reliability
    serverActions: {
      bodySizeLimit: '5mb', // for JD upload extraction
    },
  },

  // Image optimization: portfolio thumbnails are re-encoded by our ingest pipeline
  // and served from our CDN, so we mostly rely on next/image for in-app assets.
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'portfolio.nid.edu' },
      { protocol: 'https', hostname: 'www.nid.edu' },
    ],
  },

  // Transpile workspace packages
  transpilePackages: [
    '@nid/core',
    '@nid/db',
    '@nid/ui',
    '@nid/module-recruiter-onboarding',
    '@nid/module-jd-posting',
    '@nid/module-candidate-browse',
    '@nid/module-slot-booking',
    '@nid/module-interview-console',
    '@nid/module-offer-cascade',
  ],
};

export default config;
