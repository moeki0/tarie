import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "i.gyazo.com" },
      { hostname: "gyazo.com" },
    ],
  },
};

export default nextConfig;
