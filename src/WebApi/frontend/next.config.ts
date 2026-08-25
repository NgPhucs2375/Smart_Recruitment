import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/copilotkit/:path*",
        destination: "http://localhost:8000/api/copilotkit/:path*", // Trỏ sang cổng Backend .NET Core
      },
    ];
  },
};

export default nextConfig;
