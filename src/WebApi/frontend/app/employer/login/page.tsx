"use client";

import { useState } from "react";
import Link from "next/link";
import { usePasswordLogin, useGoogleAuth } from "@/hooks";
import {
  AuthLayout,
  GoogleAuthSection,
  GithubLoginButton,
  WrongPortalAlert,
} from "@/components/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Lock, ArrowRight, Loader2, Building2, Eye, EyeOff, Sparkles, KanbanSquare, ShieldCheck, LockKeyhole } from "lucide-react";

/**
 * Employer login PRESENTATION.
 * Reuses the shared auth infrastructure (usePasswordLogin / Google).
 * No duplicated authentication logic.
 */
export default function EmployerLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, errors, isPending, submitError, wrongPortal: passwordWrongPortal } = usePasswordLogin("employer");
  const { handleGoogleLogin, isPending: isGooglePending, error: googleError, wrongPortal: googleWrongPortal } = useGoogleAuth("employer");
  const wrongPortal = passwordWrongPortal ?? googleWrongPortal;

  return (
    <AuthLayout
      leftPanel={
        <div className="relative">
          {/* Single restrained glow (aria-hidden, static) */}
          <div aria-hidden="true" className="pointer-events-none absolute -right-12 top-24 size-52 rounded-full bg-marine/20 blur-3xl" />

          <p className="font-mono text-xs uppercase tracking-[0.24em] text-white/60">
            Enterprise Portal / 2026
          </p>
          <h1 className="mt-4 max-w-lg text-4xl font-medium tracking-[-0.05em] text-white xl:text-5xl">
            Chào mừng nhà tuyển dụng quay trở lại.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-white/65">
            Đăng nhập để quản lý tin tuyển dụng, pipeline ứng viên và hồ sơ doanh nghiệp của bạn.
          </p>

          {/* Illustrative pipeline snapshot: numbers are placeholders, not live data */}
          <div className="mt-7 max-w-md rounded-2xl border border-white/15 bg-white/[0.06] p-4 shadow-[0_16px_48px_rgba(0,0,0,0.25)] backdrop-blur-sm">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
              <KanbanSquare className="size-3.5 text-sandgold" /> Pipeline tuần này
            </p>
            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
              {[
                { stage: "Mới", count: "24" },
                { stage: "Sàng lọc", count: "18" },
                { stage: "Phỏng vấn", count: "6" },
                { stage: "Offer", count: "2" },
              ].map((s) => (
                <div key={s.stage} className="rounded-xl bg-white/[0.05] px-2 py-2.5">
                  <p className="font-mono text-lg font-bold text-white">{s.count}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/55">{s.stage}</p>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] text-white/60">
                <span>Tỷ lệ lấp đầy vị trí</span>
                <span className="font-mono font-bold text-white/85">78%</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[78%] rounded-full bg-sandgold" />
              </div>
            </div>
          </div>

          <div className="mt-5 max-w-md space-y-2.5">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-sm">
              <Sparkles className="size-5 shrink-0 text-teal" />
              <span className="text-sm text-white/90">AI đối chiếu CV với yêu cầu tuyển dụng theo thời gian thực</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-sm">
              <KanbanSquare className="size-5 shrink-0 text-sandgold" />
              <span className="text-sm text-white/90">Pipeline, lịch phỏng vấn và nhắc việc tập trung một nơi</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-sm">
              <ShieldCheck className="size-5 shrink-0 text-sage" />
              <span className="text-sm text-white/90">Phân quyền Người đại diện / Nhân sự rõ ràng, an toàn</span>
            </div>
          </div>

          <p className="mt-5 flex max-w-md items-center gap-2 text-xs leading-5 text-white/45">
            <LockKeyhole className="size-3.5 shrink-0" />
            SSO doanh nghiệp • Nhật ký audit đầy đủ • Dữ liệu lưu trữ trong nước
          </p>
        </div>
      }
    >
      <div className="mb-5 text-center">
        <div className="mx-auto mb-3 flex w-fit items-center gap-2 rounded-full border border-border bg-muted/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          <Building2 className="size-3" /> Cổng nhà tuyển dụng
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Đăng nhập doanh nghiệp</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">Dùng chung hệ thống xác thực HIREAI</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        {wrongPortal && <WrongPortalAlert portal={wrongPortal} />}
        {submitError && (
          <Alert variant="destructive" className="border-red-200 bg-red-50 py-2.5">
            <AlertDescription className="text-xs text-red-700">{submitError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="employer-email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Email doanh nghiệp
          </Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="employer-email"
              type="email"
              placeholder="hr@company.com"
              {...register("email")}
              disabled={isPending}
              className="h-11 rounded-xl border-input bg-white pl-10 text-sm transition focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="employer-password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Mật khẩu
            </Label>
            <Link href="/forgot-password" className="text-xs text-muted-foreground transition hover:text-foreground hover:underline">
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="employer-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              {...register("password")}
              disabled={isPending}
              className="h-11 rounded-xl border-input bg-white pl-10 pr-10 text-sm transition focus-visible:ring-1 focus-visible:ring-primary"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              aria-pressed={showPassword}
              disabled={isPending}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 transition hover:text-gray-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-50"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="mt-2 h-11 w-full rounded-xl bg-primary font-medium text-white transition hover:bg-primary-hover"
        >
          {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ArrowRight className="mr-2 size-4" />}
          {isPending ? "Đang xác thực..." : "Đăng nhập"}
        </Button>

        <div className="relative my-4 text-center text-xs text-muted-foreground">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <span className="relative bg-muted/90 px-3 uppercase tracking-wider">hoặc</span>
        </div>

        <GoogleAuthSection
          onGoogleLogin={handleGoogleLogin}
          disabled={isPending || isGooglePending}
          text="Đăng nhập nhanh bằng Google"
        />
        {googleError && <p className="text-xs text-red-500">{googleError}</p>}
        <GithubLoginButton text="Đăng nhập bằng GitHub" />
      </form>

      <div className="mt-6 border-t border-border/60 pt-4 text-center">
        <p className="text-xs text-muted-foreground">
          Chưa có tài khoản doanh nghiệp?{" "}
          <Link href="/employer/register" className="font-semibold text-foreground underline underline-offset-4 hover:opacity-80">
            Đăng ký tuyển dụng
          </Link>
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Bạn là ứng viên?{" "}
          <Link href="/login" className="font-medium text-foreground underline underline-offset-4 hover:opacity-80">
            Đăng nhập ứng viên
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
