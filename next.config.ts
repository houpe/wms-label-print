import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 站点部署在 https://houpe.top/print/ 下
  basePath: "/print",
  // 生产构建使用 webpack（chunk 命名更稳定，避免 Turbopack 在重新部署时
  // 因 chunk hash 变化导致的 ChunkLoadError / 404）
};

export default nextConfig;
