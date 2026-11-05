"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { magicLinkSchema, type MagicLinkFormData } from "@/lib/schemas";
import { requestMagicLink } from "@/lib/auth-provider";

export function useMagicLinkRegister() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<MagicLinkFormData>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: { email: "", role: "UNG_VIEN" },
  });

  const selectedRole = useWatch({ control, name: "role" });
  const sentEmail = useWatch({ control, name: "email" });

  async function onSubmit(data: MagicLinkFormData) {
    setLoading(true);
    setError(null);
    try {
      // /magic-login dùng cờ này để đưa tài khoản vừa tạo vào trang Hồ sơ thay vì
      // dashboard; mất cờ khi mở link trên thiết bị khác thì vẫn về dashboard như cũ.
      try {
        sessionStorage.setItem("hireai.magic.intent", "register");
      } catch {
        // ignore storage errors
      }
      const res = await requestMagicLink({
        email: data.email,
        purpose: "Register",
        role: data.role,
      });
      if (res.success) {
        setSent(true);
      } else {
        setError(res.message || "Gửi liên kết thất bại");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setSent(false);
    setError(null);
  }

  return {
    register,
    handleSubmit: handleSubmit(onSubmit),
    setValue,
    control,
    errors,
    loading,
    sent,
    error,
    selectedRole,
    sentEmail,
    reset,
  };
}
