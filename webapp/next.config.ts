import type { NextConfig } from "next";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "";
let convexHostname = "";
try {
  if (convexUrl) {
    convexHostname = new URL(convexUrl).hostname;
  }
} catch {
  // fallback
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...(convexHostname
        ? [
            {
              protocol: "https" as const,
              hostname: convexHostname,
            },
          ]
        : []),
      {
        protocol: "https",
        hostname: "*.convex.cloud",
      },
      {
        protocol: "https",
        hostname: "*.convex.site",
      },
      {
        protocol: "https",
        hostname: "zakkig.de",
      },
      {
        protocol: "https",
        hostname: "www.zakkig.de",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
      allowedOrigins: [
        "app.zakkig.de",
        "localhost:3000",
        "localhost:3001",
        "127.0.0.1:3000",
        "127.0.0.1:3001",
      ],
    },
  },
};

export default nextConfig;
