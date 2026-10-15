import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
