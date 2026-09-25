import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: "standalone", // yeu cau Next.js build version Production toi gian tai: .next/standalone
  typescript: { ignoreBuildErrors: true },
  serverExternalPackages: ["@copilotkit/runtime"],
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  images: {
    localPatterns: [
      {
        pathname: "/api/dotnet/hosoungviens/**/avatar",
      },
    ],
  },
  env: {
    NEXT_PUBLIC_COPILOTKIT_THREADS_ENABLED: process.env.NEXT_PUBLIC_COPILOTKIT_THREADS_ENABLED,
  },
};
export default nextConfig;
