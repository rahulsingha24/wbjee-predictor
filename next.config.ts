import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: 'https://future-engineers-54ad2.firebaseapp.com/__/auth/:path*',
      },
    ];
  },
};

export default nextConfig;
