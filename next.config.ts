import type { NextConfig } from "next";

// A parent directory on some machines contains another lockfile, which makes
// Next.js infer the wrong workspace root. Pin the root to this project so output
// file tracing (and Vercel deploys) only consider this app.
const nextConfig: NextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
