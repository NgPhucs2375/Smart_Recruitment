"use client";

import { useState, type ComponentProps } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword } from "@/lib/auth-provider";
import { changePasswordSchema, type ChangePasswordFormData } from "@/lib/schemas";

export function PasswordChangeForm() {
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({ resolver: zodResolver(changePasswordSchema) });

  async function onSubmit(data: ChangePasswordFormData) {
    setResult(null);
    const response = await changePassword(data.currentPassword, data.newPassword);
    if (response.success) {
      reset();
      setResult({ type: "success", message: response.message || "Đổi mật khẩu thành công." });
    } else {
      setResult({ type: "error", message: response.message || "Không thể đổi mật khẩu." });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div>
        <h4 className="text-sm font-medium text-foreground">Đổi mật khẩu</h4>
        <p className="mt-0.5 text-xs text-muted-foreground">Xác nhận mật khẩu hiện tại trước khi tạo mật khẩu mới.</p>
      </div>
      {result && (
        <Alert variant={result.type === "error" ? "destructive" : "default"}>
          <AlertDescription className="text-xs">{result.message}</AlertDescription>
        </Alert>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <PasswordField label="Mật khẩu hiện tại" error={errors.currentPassword?.message} {...register("currentPassword")} />
        <PasswordField label="Mật khẩu mới" error={errors.newPassword?.message} {...register("newPassword")} />
        <PasswordField label="Xác nhận mật khẩu mới" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
      </div>
      <Button type="submit" size="sm" className="rounded-xl" disabled={isSubmitting}>
        {isSubmitting ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
      </Button>
    </form>
  );
}

function PasswordField({ label, error, ...props }: ComponentProps<typeof Input> & { label: string; error?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input type="password" autoComplete="new-password" {...props} />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
