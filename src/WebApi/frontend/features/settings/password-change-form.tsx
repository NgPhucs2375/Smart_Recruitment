"use client";

import { useId, useState, type ComponentProps } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { changePassword, authProvider } from "@/lib/auth-provider";
import { useRouter } from "next/navigation";
import { changePasswordSchema, type ChangePasswordFormData } from "@/lib/schemas";

export function PasswordChangeForm() {
  const router = useRouter();
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({ resolver: zodResolver(changePasswordSchema) });

  async function onSubmit(data: ChangePasswordFormData) {
    setResult(null);
    try {
      const response = await changePassword(data.currentPassword, data.newPassword);
      if (response.success) {
        reset();
        setResult({ type: "success", message: response.message || "Đổi mật khẩu thành công." });
        toast.success(response.message || "Đổi mật khẩu thành công.");
        const logout = await authProvider.logout({});
        router.replace(typeof logout.redirectTo === "string" ? logout.redirectTo : "/login");
      } else {
        setResult({ type: "error", message: response.message || "Không thể đổi mật khẩu." });
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Không thể đổi mật khẩu.";
      setResult({ type: "error", message });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div>
        <h4 className="text-sm font-medium text-foreground">Đổi mật khẩu</h4>
        <p className="mt-0.5 text-xs text-muted-foreground">Xác nhận mật khẩu hiện tại trước khi tạo mật khẩu mới.</p>
      </div>
      {result && (
        <Alert variant={result.type === "error" ? "destructive" : "default"} role={result.type === "error" ? "alert" : "status"}>
          <AlertDescription className="text-xs">{result.message}</AlertDescription>
        </Alert>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <PasswordField label="Mật khẩu hiện tại" autoComplete="current-password" error={errors.currentPassword?.message} {...register("currentPassword")} />
        <PasswordField label="Mật khẩu mới" autoComplete="new-password" error={errors.newPassword?.message} {...register("newPassword")} />
        <PasswordField label="Xác nhận mật khẩu mới" autoComplete="new-password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
      </div>
      <Button type="submit" size="sm" className="rounded-xl" disabled={isSubmitting}>
        {isSubmitting ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
      </Button>
    </form>
  );
}

function PasswordField({ label, error, autoComplete = "new-password", ...props }: ComponentProps<typeof Input> & { label: string; error?: string }) {
  const id = useId();
  const errorId = `${id}-error`;
  const invalid = Boolean(error);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <Input id={id} type="password" autoComplete={autoComplete} aria-invalid={invalid} aria-describedby={invalid ? errorId : undefined} {...props} />
      {error && <p id={errorId} role="alert" className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
