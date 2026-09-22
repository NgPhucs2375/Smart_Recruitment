import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output cho Docker production (server.js + static tách gọn).
  // Dev (next dev) không bị ảnh hưởng.
  output: "standalone",
  typescript: { ignoreBuildErrors: true },
  serverExternalPackages: ["@copilotkit/runtime"],
  env: {
  NEXT_PUBLIC_COPILOTKIT_THREADS_ENABLED: process.env.NEXT_PUBLIC_COPILOTKIT_THREADS_ENABLED,
},
};


export default nextConfig;
