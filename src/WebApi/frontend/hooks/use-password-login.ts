"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/lib/schemas";
import type { PortalKind } from "@/lib/portal-roles";
import { useAuthLogin } from "@/components/auth/use-auth";

const SAVED_EMAIL_KEY = "saved_login_email";

/**
 * Password form concerns (RHF + zod + remember-me email).
 * Submission itself delegates to the shared `useAuthLogin` engine.
 */
export function usePasswordLogin(portal?: PortalKind, next?: string | null) {
  const auth = useAuthLogin(portal, next);

  const {
    register,
    handleSubmit: rhfSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem(SAVED_EMAIL_KEY);
      if (savedEmail) {
        reset({ email: savedEmail, password: "", remember: true });
      }
    } catch {
      // Ignore storage errors
    }
  }, [reset]);

  const remember = useWatch({ control, name: "remember" });

  async function onSubmit(data: LoginFormData) {
    if (data.remember) {
      localStorage.setItem(SAVED_EMAIL_KEY, data.email);
    } else {
      localStorage.removeItem(SAVED_EMAIL_KEY);
    }
    await auth.loginWithPassword(data.email, data.password);
  }

  return {
    register,
    handleSubmit: rhfSubmit(onSubmit),
    setValue,
    errors,
    isPending: auth.isPending,
    submitError: auth.error,
    remember,
  };
}
