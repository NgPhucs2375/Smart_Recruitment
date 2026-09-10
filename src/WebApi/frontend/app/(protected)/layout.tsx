"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/layout";
import { getAuthToken, refreshIdentity } from "@/lib/auth-provider";
import { CopilotProvider } from "@/app/providers/CopilotProvider";

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
