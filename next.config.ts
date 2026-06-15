import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/print",
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
