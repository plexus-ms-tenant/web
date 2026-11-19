import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // BUILD_HASH comes from the image build; without it Next draws a random ID, as in development.
  generateBuildId: () => process.env.BUILD_HASH || null,
  // The workspace root, two levels up from this app.
  outputFileTracingRoot: fileURLToPath(new URL('../../', import.meta.url)),
};

export default nextConfig;
