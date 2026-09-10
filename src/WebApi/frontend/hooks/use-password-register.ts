"use client";

import { useRegister } from "@refinedev/core";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterFormData } from "@/lib/schemas";
import { useEffect, useState } from "react";

export function usePasswordRegister() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { mutateAsync: registerMutation, isPending } = useRegister<RegisterFormData>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      role: "UNG_VIEN",
      hoTen: "",
      soDienThoai: "",
      tenDoanhNghiep: "",
      diaChiDoanhNghiep: "",
      chucVu: "",
      inviteToken: "",
    },
  });

  useEffect(() => {
    const inviteToken = searchParams.get("inviteToken") ?? searchParams.get("token");
    const email = searchParams.get("email");
    if (inviteToken) {
      setValue("inviteToken", inviteToken);
    }
    if (email) {
      setValue("email", email);
    }
  }, [searchParams, setValue]);

  const selectedRole = useWatch({ control, name: "role" });
  const inviteToken = useWatch({ control, name: "inviteToken" });

  async function onSubmit(data: RegisterFormData) {
    setSubmitError(null);
    try {
      const result = await registerMutation(data);
      if (!result.success && result.error) {
        setSubmitError(result.error.message ?? "Đăng ký thất bại");
      } else if (result.success) {
        router.replace("/login");
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
    inviteToken,
  };
}
