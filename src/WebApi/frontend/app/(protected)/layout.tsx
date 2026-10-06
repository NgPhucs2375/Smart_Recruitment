<<<<<<< HEAD
"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AppLayout } from "@/components/layout/layout";
import { getAuthToken, redirectToLogin, refreshIdentity } from "@/lib/auth-provider";
import { loadIdentity } from "@/lib/access-control-provider";

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
    let cancelled = false;

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
=======
"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AppLayout } from "@/components/layout/layout";
import { getAuthToken, redirectToLogin, refreshIdentity } from "@/lib/auth-provider";
import { loadIdentity } from "@/lib/access-control-provider";

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
    let cancelled = false;

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
        // Refresh permissions in the background without blocking the cached session.
        void refreshIdentity();
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
>>>>>>> origin/dev-Phuc2
