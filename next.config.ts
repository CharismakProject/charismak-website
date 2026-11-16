import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The walkthroughs now live inside the Construction Explorer (temporary while it settles).
  async redirects() {
    return [
      { source: "/rates/walkthrough", destination: "/construction-explorer?model=bungalow", permanent: false },
      { source: "/rates/build-walkthrough", destination: "/construction-explorer?model=storey-building", permanent: false },
    ];
  },
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
