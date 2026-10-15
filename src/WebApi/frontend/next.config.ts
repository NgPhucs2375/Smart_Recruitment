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
    // Chỉ nạp module thực sự dùng từ các barrel lớn (lucide-react đã nằm trong
    // default list của Next 16 — giữ lại cho rõ nghĩa). Cắt thời gian compile
    // dashboard 52s trước đây, nay cộng thêm Turbopack.
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "@refinedev/core",
      "@refinedev/nextjs-router",
      "@copilotkit/react-core",
      "@copilotkit/react-ui",
      "@copilotkit/react-textarea",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
      "sonner",
      "react-hook-form",
    ],
  },
  // Chỉ chạy khi dùng script fallback --webpack (dev:webpack / build:webpack).
  // Turbopack không dùng config này; nó tự lo watcher, không cần poll chống OOM.
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
