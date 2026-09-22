import { legacyRedirects } from './lib/legacy-redirects.mjs';
import { manualRedirects } from './lib/manual-redirects.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NODE_ENV === 'development' ? undefined : 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  // Static production HTTP redirects are supplied in public/_redirects and vercel.json.
  ...(process.env.NODE_ENV === 'development' ? { redirects: async () => [...legacyRedirects,...manualRedirects].map(rule => ({ ...rule, statusCode: 301 })) } : {}),
};

export default nextConfig;
