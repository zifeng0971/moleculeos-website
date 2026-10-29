import { legacyRedirects } from './lib/legacy-redirects.mjs';
import { manualRedirects } from './lib/manual-redirects.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Each dev server can build into its own folder (NEXT_DIST_DIR), so several running side by side never overwrite each other.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Opt-in for preview deploys: the committed studio-v3 code has a type error that is not part of the site.
  typescript: { ignoreBuildErrors: process.env.NEXT_IGNORE_BUILD_ERRORS === '1' },
  output: process.env.NODE_ENV === 'development' ? undefined : 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  // Static production HTTP redirects are supplied in public/_redirects and vercel.json.
  ...(process.env.NODE_ENV === 'development' ? { redirects: async () => [...legacyRedirects,...manualRedirects].map(rule => ({ ...rule, statusCode: 301 })) } : {}),
};

export default nextConfig;
