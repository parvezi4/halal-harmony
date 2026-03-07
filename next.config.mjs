/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    reactCompiler: true,
  },
  // Disable Next.js built-in ESLint during build
  // We run ESLint separately with our flat config (eslint.config.mjs)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable Next.js built-in TypeScript checking during build
  // We run type checking separately via npm run typecheck
  typescript: {
    ignoreBuildErrors: true,
  },
  // Next.js App Router looks for app/ at the root by default
  // Since we have it in src/app/, we use a symlink or move app to root
  // For now, the structure is: app/ at SRC_ROOT/app (git tracks app/ at root level)
};

export default nextConfig;
