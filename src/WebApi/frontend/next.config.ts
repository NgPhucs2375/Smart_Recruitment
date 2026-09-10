import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  serverExternalPackages: ["@copilotkit/runtime"],
  env: {
  NEXT_PUBLIC_COPILOTKIT_THREADS_ENABLED: process.env.NEXT_PUBLIC_COPILOTKIT_THREADS_ENABLED,
},
};


export default nextConfig;
