import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,

  // Standalone output for self-hosted/Docker (Phase 6.13.8). Vercel runs its own
  // serverless build, so skip standalone there to avoid monorepo output conflicts.
  ...(process.env['VERCEL'] ? {} : { output: 'standalone' as const }),

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
    '@nid/module-student-portal',
    '@nid/module-admin-accountability',
    '@nid/module-recruiter-engagement',
    '@nid/module-admin-cms',
  ],
};

export default config;
