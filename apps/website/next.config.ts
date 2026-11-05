import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // The build hash is the build ID when the image is built from a hash
  // (docker/Dockerfile, BUILD_HASH), so that two builds of the same inputs
  // agree; without it Next draws a random one, as in development.
  generateBuildId: () => process.env.BUILD_HASH || null,
  // Monorepo: trace files from the workspace root (two levels up from this app).
  outputFileTracingRoot: fileURLToPath(new URL('../../', import.meta.url)),
};

export default nextConfig;
