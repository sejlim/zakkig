import type { NextConfig } from "next";

const appwriteEndpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const appwriteHostname = new URL(appwriteEndpoint).hostname;

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: appwriteHostname,
      },
      {
        protocol: "https",
        hostname: "zakkig.de",
      },
    ],
  },
  serverExternalPackages: [],
  serverActions: {
    bodySizeLimit: "5mb",
  },
};

export default nextConfig;
