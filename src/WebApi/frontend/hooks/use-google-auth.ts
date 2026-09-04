"use client";

import { useLogin } from "@refinedev/core";
import { useState } from "react";

export function useGoogleAuth() {
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync: login, isPending } = useLogin();

  async function handleGoogleLogin(credential: string) {
    setError(null);
    const result = await login({ providerName: "google", credential });
    if (!result.success && result.error) {
      setError(result.error.message ?? "Đăng nhập Google thất bại");
    }
  }

  return {
    handleGoogleLogin,
    isPending,
    error,
    setError,
  };
}
