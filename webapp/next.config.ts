import type { NextConfig } from "next"

const appwriteEndpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const appwriteHostname = new URL(appwriteEndpoint).hostname;

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: appwriteHostname,
      },
      {
        protocol: 'https',
        hostname: 'zakkig.de',
      },
    ],
  },
}

export default nextConfig
