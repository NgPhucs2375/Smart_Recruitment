"use client";

import { useLogin } from "@refinedev/core";
import { useState } from "react";
import type { PortalKind } from "@/lib/portal-roles";
import { normalizeAuthError } from "./login-handler";

/**
 * Shared login engine for every login UI.
 * Wraps Refine `useLogin` (→ `authProvider.login` → POST /account/authenticate
 * or /external-login → tokens → GET /account/me → role-based redirect).
 *
 * UI pages only: render design, collect credentials, call
 * `loginWithPassword` / `loginWithGoogle`. Loading + error state included.
 */
export function useAuthLogin(portal?: PortalKind, next?: string | null) {
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync: loginMutate, isPending } = useLogin();

  async function submit(payload: Record<string, unknown>) {
    setError(null);
    try {
      const result = await loginMutate({
        ...payload,
        portal,
        redirectTo: next,
      });
      if (!result.success && result.error) {
        setError(
          normalizeAuthError(result.error, "Email hoặc mật khẩu không chính xác"),
        );
      }
      return result;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Đăng nhập thất bại";
      setError(message);
      return {
        success: false as const,
        error: { name: "Đăng nhập thất bại", message },
      };
    }
  }

  function loginWithPassword(email: string, password: string) {
    return submit({ email, password });
  }

  function loginWithGoogle(credential: string) {
    return submit({ providerName: "google", credential });
  }

  return {
    loginWithPassword,
    loginWithGoogle,
    isPending,
    error,
    setError,
  };
}
