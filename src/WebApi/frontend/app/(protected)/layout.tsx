"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/layout";
import { getAuthToken, refreshIdentity } from "@/lib/auth-provider";

// Keep the large CopilotKit client bundle out of the protected route layout.
// The page can render while the optional assistant bundle loads separately.
const CopilotProvider = dynamic(
  async () => {
    const copilotModule = await import("@/app/providers/CopilotProvider");
    return copilotModule.CopilotProvider;
  },
  { ssr: false },
);

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!getAuthToken()) {
      router.replace("/login");
      return;
    }
    // Làm mới identity nền (quyền trong localStorage có thể cũ sau khi
    // backend đổi policy). Sidebar tự cập nhật qua subscription,
    // layout không cần re-render nên không gây chớp nháy.
    void refreshIdentity();
  }, [router]);

  return (
    <CopilotProvider>
      <AppLayout>{children}</AppLayout>
    </CopilotProvider>
  );
}
