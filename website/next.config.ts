import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['zakkig.de', 'www.zakkig.de'],
    },
  },
}

export default nextConfig
