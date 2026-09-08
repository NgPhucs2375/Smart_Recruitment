"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/layout";
import { getAuthToken } from "@/lib/auth-provider";
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
    }
  }, [router]);

  return (
    <CopilotProvider>
      <AppLayout>{children}</AppLayout>
    </CopilotProvider>
  );
}
