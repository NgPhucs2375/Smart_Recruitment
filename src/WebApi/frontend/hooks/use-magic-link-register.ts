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
    defaultValues: { email: "", role: "UNG_VIEN", hoTen: "", soDienThoai: "" },
  });

  const selectedRole = useWatch({ control, name: "role" });

  async function onSubmit(data: MagicLinkFormData) {
    setLoading(true);
    setError(null);
    try {
      const res = await requestMagicLink({
        email: data.email,
        purpose: "Register",
        role: data.role,
        hoTen: data.hoTen,
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
    reset,
  };
}
