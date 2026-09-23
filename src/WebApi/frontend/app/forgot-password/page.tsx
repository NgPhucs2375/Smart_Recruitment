"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/lib/auth-provider";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/schemas";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordFormData) {
    setError(null);
    const result = await requestPasswordReset(data.email);
    if (result.success) setSent(true);
    else setError(result.message || "Không thể gửi email đặt lại mật khẩu.");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <Link href="/login" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Quay lại đăng nhập
        </Link>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Quên mật khẩu?</h1>
        <p className="mt-2 text-sm text-muted-foreground">Nhập email tài khoản, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.</p>
        {sent ? (
          <Alert className="mt-6">
            <AlertDescription>Liên kết đặt lại mật khẩu đã được gửi nếu email tồn tại trong hệ thống. Hãy kiểm tra hộp thư.</AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" autoComplete="email" className="pl-9" placeholder="you@example.com" {...register("email")} />
              </div>
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Gửi liên kết đặt lại
            </Button>
          </form>
        )}
      </section>
    </main>
  );
}
