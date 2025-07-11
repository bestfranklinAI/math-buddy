import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/static/images/:path*',
        destination: 'http://localhost:8000/static/images/:path*'
      }
    ];
  }
};

export default nextConfig;
