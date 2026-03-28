import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img1.hscicdn.com' },
      { protocol: 'https', hostname: 'cricbuzz-cricket.p.rapidapi.com' },
    ],
  },
};

export default nextConfig;
