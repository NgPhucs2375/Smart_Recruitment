import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: "standalone", // yeu cau Next.js build version Production toi gian tai: .next/standalone
  typescript: { ignoreBuildErrors: true },
  serverExternalPackages: ["@copilotkit/runtime"],
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  turbopack: {
    // The frontend runs independently; ignore the repository-level lockfile.
    root: __dirname,
  },
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
  experimental: {
    // Chỉ nạp icon/component thực sự dùng (lucide-react có mặt ở 143 file) —
    // cắt thời gian compile dashboard 52s, giải phóng RAM chống restart.
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Chặn watcher quét đệ quy vào cache: Next.js ghi cache vào `.next`
      // -> watcher phát hiện file mới -> compile lại vô tận -> OOM (ERR_EMPTY_RESPONSE).
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ["**/node_modules/**", "**/.next/**", "**/dist/**"],
      };
    }
    return config;
  },
};
export default nextConfig;
