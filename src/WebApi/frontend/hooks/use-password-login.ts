"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/lib/schemas";
import type { PortalKind } from "@/lib/portal-roles";
import { useAuthLogin } from "@/components/auth/use-auth";

const SAVED_EMAIL_KEY = "saved_login_email";
/** Đếm sai liên tiếp theo email (chỉ số lượng + mốc giờ, không lưu mật khẩu). */
const FAILS_KEY = "hireai:login-fails";
const COOLDOWN_STEPS: [number, number][] = [[7, 60], [5, 30], [3, 10]];

type FailState = { count: number; lastAt: number };

function readFails(): Record<string, FailState> {
  try {
    const raw = localStorage.getItem(FAILS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, FailState>;
  } catch {
    return {};
  }
}

function cooldownFor(count: number): number {
  for (const [threshold, seconds] of COOLDOWN_STEPS) {
    if (count >= threshold) return seconds;
  }
  return 0;
}

function remainingCooldown(email: string): number {
  const entry = readFails()[email.trim().toLowerCase()];
  if (!entry) return 0;
  const wait = cooldownFor(entry.count);
  if (wait <= 0) return 0;
  return Math.max(0, Math.ceil((entry.lastAt + wait * 1000 - Date.now()) / 1000));
}

function recordFail(email: string): number {
  const key = email.trim().toLowerCase();
  const all = readFails();
  const prev = all[key];
  const next = { count: (prev?.count ?? 0) + 1, lastAt: Date.now() };
  all[key] = next;
  try {
    localStorage.setItem(FAILS_KEY, JSON.stringify(all));
  } catch {
    // Ignore storage errors
  }
  const wait = cooldownFor(next.count);
  return wait <= 0
    ? 0
    : Math.max(0, Math.ceil((next.lastAt + wait * 1000 - Date.now()) / 1000));
}

function clearFails(email: string): void {
  const key = email.trim().toLowerCase();
  const all = readFails();
  if (all[key]) {
    delete all[key];
    try {
      localStorage.setItem(FAILS_KEY, JSON.stringify(all));
    } catch {
      // Ignore storage errors
    }
  }
}

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
  const email = useWatch({ control, name: "email" });

  // Đếm ngược cooldown khi email hiện tại đang bị chờ (đổi email reset).
  const [cooldownLeft, setCooldownLeft] = useState(0);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCooldownLeft(remainingCooldown(email ?? ""));
    if (!email) return;
    const timer = window.setInterval(() => {
      setCooldownLeft(remainingCooldown(email));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [email]);
  const cooling = cooldownLeft > 0;

  async function onSubmit(data: LoginFormData) {
    if (remainingCooldown(data.email) > 0) {
      setCooldownLeft(remainingCooldown(data.email));
      return;
    }
    if (data.remember) {
      localStorage.setItem(SAVED_EMAIL_KEY, data.email);
    } else {
      localStorage.removeItem(SAVED_EMAIL_KEY);
    }
    const result = await auth.loginWithPassword(data.email, data.password, data.remember);
    if (result.success) {
      clearFails(data.email);
      setCooldownLeft(0);
    } else {
      setCooldownLeft(recordFail(data.email));
    }
  }

  return {
    register,
    handleSubmit: rhfSubmit(onSubmit),
    setValue,
    errors,
    isPending: auth.isPending,
    submitError: auth.error,
    remember,
    email,
    cooling,
    cooldownLeft,
  };
}
