"use client";

import { useLogin } from "@refinedev/core";
import { useState } from "react";
import type { PortalKind } from "@/lib/portal-roles";
import { WRONG_PORTAL_ERROR } from "./use-password-login";

export function useGoogleAuth(portal?: PortalKind) {
  const [error, setError] = useState<string | null>(null);
  const [wrongPortal, setWrongPortal] = useState<PortalKind | null>(null);
  const { mutateAsync: login, isPending } = useLogin();

  async function handleGoogleLogin(credential: string) {
    setError(null);
    setWrongPortal(null);
    const result = await login({ providerName: "google", credential, portal });
    if (!result.success && result.error) {
      if (result.error.name === WRONG_PORTAL_ERROR && portal) {
        setWrongPortal(portal);
      }
      setError(result.error.message ?? "Đăng nhập Google thất bại");
    }
  }

  return {
    handleGoogleLogin,
    isPending,
    error,
    setError,
    wrongPortal,
    clearWrongPortal: () => setWrongPortal(null),
  };
}
