import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "preview-chat-3faeadcc-72a8-4e86-b0f7-3c5e2b694843.space-z.ai",
    "*.space-z.ai",
  ],
};

export default nextConfig;
