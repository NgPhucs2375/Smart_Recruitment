"use client";

import type { PortalKind } from "@/lib/portal-roles";
import { useAuthLogin } from "@/components/auth/use-auth";

/**
 * Google-login presenter. Delegates to the shared `useAuthLogin` engine.
 */
export function useGoogleAuth(portal?: PortalKind, next?: string | null) {
  const auth = useAuthLogin(portal, next);

  return {
    handleGoogleLogin: auth.loginWithGoogle,
    isPending: auth.isPending,
    error: auth.error,
    setError: auth.setError,
  };
}
