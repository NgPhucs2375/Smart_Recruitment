"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, KeyRound, Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/auth-layout";
import { resetPassword } from "@/lib/auth-provider";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/schemas";

const TIPS = [
  { title: "Tối thiểu 6 ký tự", desc: "Càng dài càng khó đoán." },
  { title: "Không dùng lại mật khẩu cũ", desc: "Mật khẩu đã lộ ở đâu đó thì coi như lộ ở đây." },
  { title: "Link có hiệu lực giới hạn", desc: "Quá hạn thì quay lại trang quên mật khẩu gửi link mới." },
];

function ResetLeftPanel() {
  return (
    <div className="relative">
      <p className="text-xs font-bold uppercase tracking-[0.32em] text-white/50">
        HIREAI
      </p>
      <h1 className="mt-3 max-w-lg text-4xl font-medium tracking-[-0.05em] text-white xl:text-5xl">
        Đặt lại mật khẩu.
      </h1>
      <p className="mt-4 max-w-md text-sm leading-6 text-white/65">
        Chọn mật khẩu mới cho tài khoản của bạn — xong là đăng nhập ngay được.
      </p>

      <div className="mt-7 max-w-md space-y-2.5">
        {TIPS.map((tip, i) => (
          <div key={tip.title} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 backdrop-blur-sm">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 font-mono text-xs font-bold text-white">
              {i + 1}
            </span>
            <span>
              <span className="block text-sm font-semibold text-white">{tip.title}</span>
              <span className="block text-xs text-white/60">{tip.desc}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex max-w-md items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
        <ShieldCheck className="size-5 shrink-0 text-sandgold" />
        <span className="flex-1 text-sm text-white/90">HIREAI không bao giờ hỏi mật khẩu qua email hay điện thoại.</span>
      </div>
    </div>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";
  const missingParams = !email || !token;
  const missingLinkMessage = "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã thiếu thông tin.";
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  async function onSubmit(data: ResetPasswordFormData) {
    setError(null);
    if (missingParams) {
      setError(missingLinkMessage);
      return;
    }
    const result = await resetPassword(email, token, data.password);
    if (result.success) setSuccess(true);
    else setError(result.message || "Không thể đặt lại mật khẩu.");
  }

  return (
    <AuthLayout leftPanel={<ResetLeftPanel />}>
      <div className="mb-4 text-center">
        <div className="mx-auto mb-3 flex w-fit items-center gap-2 rounded-full border border-border bg-muted/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          <KeyRound className="size-3" /> Khôi phục truy cập
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Đặt lại mật khẩu</h2>
        <p className="mt-1 text-sm text-muted-foreground">Dùng chung hệ thống xác thực HIREAI</p>
      </div>

      <Link href="/login" className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Quay lại đăng nhập
      </Link>
      {success ? (
        <div className="mt-2 space-y-4">
          <Alert><AlertDescription>Mật khẩu đã được đặt lại thành công.</AlertDescription></Alert>
          <Link href="/login" className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">Đăng nhập ngay</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-2 space-y-4">
          {(missingParams || error) && (
            <Alert variant="destructive">
              <AlertDescription>{missingParams ? missingLinkMessage : error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="password">Mật khẩu mới</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? "text" : "password"} maxLength={100} autoComplete="new-password" {...register("password")} className="pr-9" />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                aria-pressed={showPassword}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
            <div className="relative">
              <Input id="confirmPassword" type={showPassword ? "text" : "password"} maxLength={100} autoComplete="new-password" {...register("confirmPassword")} className="pr-9" />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                aria-pressed={showPassword}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Đặt lại mật khẩu
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<main className="min-h-dvh bg-background" />}><ResetPasswordContent /></Suspense>;
}
