"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, KeyRound, Loader2, Mail, Send, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/auth-layout";
import { requestPasswordReset } from "@/lib/auth-provider";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/schemas";

const STEPS = [
  { icon: Mail, title: "Nhập email", desc: "Địa chỉ email đã đăng ký tài khoản." },
  { icon: Send, title: "Nhận liên kết", desc: "Link đặt lại gửi tới hộp thư trong vài phút." },
  { icon: KeyRound, title: "Đặt mật khẩu mới", desc: "Mở link, nhập mật khẩu mới, đăng nhập lại." },
];

function ForgotLeftPanel() {
  return (
    <div className="relative">
      <p className="text-xs font-bold uppercase tracking-[0.32em] text-white/50">
        HIREAI
      </p>
      <h1 className="mt-3 max-w-lg text-4xl font-medium tracking-[-0.05em] text-white xl:text-5xl">
        Quên mật khẩu?
      </h1>
      <p className="mt-4 max-w-md text-sm leading-6 text-white/65">
        Đừng lo — lấy lại quyền truy cập chỉ mất 1 phút với email của bạn.
      </p>

      <div className="mt-7 max-w-md space-y-2.5">
        {STEPS.map((step, i) => (
          <div key={step.title} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 backdrop-blur-sm">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 font-mono text-xs font-bold text-white">
              {i + 1}
            </span>
            <span>
              <span className="block text-sm font-semibold text-white">{step.title}</span>
              <span className="block text-xs text-white/60">{step.desc}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex max-w-md items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
        <ShieldCheck className="size-5 shrink-0 text-sandgold" />
        <span className="flex-1 text-sm text-white/90">Không tiết lộ email người khác — hệ thống luôn báo thành công như nhau.</span>
      </div>
    </div>
  );
}

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
    <AuthLayout leftPanel={<ForgotLeftPanel />}>
      <div className="mb-4 text-center">
        <div className="mx-auto mb-3 flex w-fit items-center gap-2 rounded-full border border-border bg-muted/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          <KeyRound className="size-3" /> Khôi phục truy cập
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Quên mật khẩu?</h2>
        <p className="mt-1 text-sm text-muted-foreground">Dùng chung hệ thống xác thực HIREAI</p>
      </div>

      <Link href="/login" className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Quay lại đăng nhập
      </Link>
      {sent ? (
        <Alert className="mt-2">
          <AlertDescription>Liên kết đặt lại mật khẩu đã được gửi nếu email tồn tại trong hệ thống. Hãy kiểm tra hộp thư.</AlertDescription>
        </Alert>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-2 space-y-4">
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="email" type="email" maxLength={100} autoComplete="email" className="pl-9" placeholder="you@example.com" {...register("email")} />
            </div>
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Gửi liên kết đặt lại
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
