"use client";

import { useRegister } from "@refinedev/core";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterFormData } from "@/lib/schemas";
import { useState } from "react";

export function usePasswordRegister(options?: {
  inviteToken?: string | null;
  email?: string;
  hoTen?: string;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { mutateAsync: registerMutation, isPending } = useRegister<RegisterFormData>();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: options?.email ?? "",
      password: "",
      confirmPassword: "",
      role: "UNG_VIEN",
      hoTen: options?.hoTen ?? "",
      soDienThoai: "",
      tenDoanhNghiep: "",
      diaChiDoanhNghiep: "",
      chucVu: "",
      inviteToken: options?.inviteToken ?? undefined,
    },
  });

  const selectedRole = useWatch({ control, name: "role" });

  async function onSubmit(data: RegisterFormData) {
    setSubmitError(null);
    try {
      const result = await registerMutation(data);
      if (!result.success && result.error) {
        setSubmitError(result.error.message ?? "Đăng ký thất bại");
      } else if (result.success) {
        // Tài khoản chỉ dùng được sau khi bấm link trong mail, nên đưa thẳng về
        // màn đăng nhập kèm email vừa ký để khối "gửi lại email xác minh" hiện ra.
        const target = options?.inviteToken ? "/employer/login" : "/login";
        router.replace(`${target}?unverified=1&email=${encodeURIComponent(data.email)}`);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    }
  }

  return {
    register,
    handleSubmit: handleSubmit(onSubmit),
    setValue,
    control,
    errors,
    isPending,
    submitError,
    selectedRole,
  };
}
