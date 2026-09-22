"use client";

import { useLogin } from "@refinedev/core";
import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/lib/schemas";
import type { PortalKind } from "@/lib/portal-roles";

const SAVED_EMAIL_KEY = "saved_login_email";

export const WRONG_PORTAL_ERROR = "Sai cổng đăng nhập";

export function usePasswordLogin(portal?: PortalKind, next?: string | null) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [wrongPortal, setWrongPortal] = useState<PortalKind | null>(null);
  const { mutateAsync: login, isPending } = useLogin<LoginFormData>();

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
    setSubmitError(null);
    setWrongPortal(null);

    if (data.remember) {
      localStorage.setItem(SAVED_EMAIL_KEY, data.email);
    } else {
      localStorage.removeItem(SAVED_EMAIL_KEY);
    }

    try {
      const result = await login({ ...data, portal, redirectTo: next } as LoginFormData & {
        portal?: PortalKind;
        redirectTo?: string | null;
      });
      if (!result.success && result.error) {
        if (result.error.name === WRONG_PORTAL_ERROR && portal) {
          setWrongPortal(portal);
        }
        setSubmitError(result.error.message ?? "Email hoặc mật khẩu không chính xác");
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    }
  }

  return {
    register,
    handleSubmit: rhfSubmit(onSubmit),
    setValue,
    errors,
    isPending,
    submitError,
    remember,
    wrongPortal,
    clearWrongPortal: () => setWrongPortal(null),
  };
}
