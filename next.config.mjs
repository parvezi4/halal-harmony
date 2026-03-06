/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    reactCompiler: true,
  },
  // Next.js App Router looks for app/ at the root by default
  // Since we have it in src/app/, we use a symlink or move app to root
  // For now, the structure is: app/ at SRC_ROOT/app (git tracks app/ at root level)
};

export default nextConfig;
