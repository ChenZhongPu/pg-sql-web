import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true, // 忽略 TypeScript 构建错误
  },
};

export default nextConfig;
