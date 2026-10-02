"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AppLayout } from "@/components/layout/layout";
<<<<<<< HEAD
import { getAuthToken, loginRouteForPortal, refreshIdentity } from "@/lib/auth-provider";
=======
import { getAuthToken, redirectToLogin, refreshIdentity } from "@/lib/auth-provider";
import { loadIdentity } from "@/lib/access-control-provider";
>>>>>>> origin/dev-Phuc2

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
  const [authenticated, setAuthenticated] = useState(false);
  const redirecting = useRef(false);

  useEffect(() => {
<<<<<<< HEAD
    if (!getAuthToken()) {
      // Về đúng cổng đã dùng (employer không bị đá sang /login candidate).
      router.replace(loginRouteForPortal());
      return;
    }
    // Làm mới identity nền (quyền trong localStorage có thể cũ sau khi
    // backend đổi policy). Sidebar tự cập nhật qua subscription,
    // layout không cần re-render nên không gây chớp nháy.
    void refreshIdentity();
  }, [router]);
=======
    let cancelled = false;
>>>>>>> origin/dev-Phuc2

    function forceLoginRedirect() {
      if (redirecting.current) return;
      redirecting.current = true;
      redirectToLogin();
    }

    async function validateSession() {
      // Avoid waiting for /me or refresh-token when the browser has no session.
      if (!getAuthToken()) {
        forceLoginRedirect();
        return;
      }

      // Login already fetched /me and stored the identity before redirecting.
      // Reusing it avoids a second blocking /me request on every navigation.
      if (loadIdentity()) {
        if (!cancelled) setAuthenticated(true);
        return;
      }

      const valid = await refreshIdentity();

      if(cancelled) return;
      if(!valid){
        forceLoginRedirect();
        return;
      }
      setAuthenticated(true);
    }

    void validateSession();

    const handleSessionChange = () => {
      if (!getAuthToken()) forceLoginRedirect();
    };
    window.addEventListener("storage", handleSessionChange);
    window.addEventListener("hireai:identity-changed", handleSessionChange);

    return () =>{
      cancelled = true;
      window.removeEventListener("storage", handleSessionChange);
      window.removeEventListener("hireai:identity-changed", handleSessionChange);
    };
  }, []);

  if(!authenticated){
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background"
      aria-busy="true">
        <div role="status" aria-live="polite">
          <p className="text-center text-muted-foreground">
            Đang xác thực phiên đăng nhập ...
          </p>
        </div>
      </main>
    )
  }
  return (
    <CopilotProvider>
      <AppLayout>{children}</AppLayout>
    </CopilotProvider>
  );
}
