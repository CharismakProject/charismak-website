import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The walkthroughs now live inside the Construction Explorer (temporary while it settles).
  async redirects() {
    return [
      { source: "/rates/walkthrough", destination: "/construction-explorer?model=bungalow", permanent: false },
      { source: "/rates/build-walkthrough", destination: "/construction-explorer?model=storey-building", permanent: false },
    ];
  },
  // Pascal's editor ships TypeScript source; viewer/core are transpiled for consistent three.js handling.
  // Type checking runs in `npm run build` via scripts/typecheck.mjs, which checks this project's code
  // but not the raw TypeScript that @pascal-app/editor ships.
  typescript: { ignoreBuildErrors: true },
  transpilePackages: ["@pascal-app/editor", "@pascal-app/viewer", "@pascal-app/core", "@pascal-app/nodes"],
  images: {
    qualities: [75, 85, 90, 95],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mxjtxcajzopjahzqwwvf.supabase.co",
        pathname: "/storage/v1/object/public/content-media/**",
      },
    ],
  },
};

export default nextConfig;
