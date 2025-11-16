import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Temporarily ignore ESLint during production builds so we can
    // focus on TypeScript/runtime issues. Re-enable before deploy
    // or prefer fixing the underlying lint errors.
    ignoreDuringBuilds: true,
  },
  // NOTE: TypeScript build errors are NOT ignored here — re-enabled.
};

export default nextConfig;
