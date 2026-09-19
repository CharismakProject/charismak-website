import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
