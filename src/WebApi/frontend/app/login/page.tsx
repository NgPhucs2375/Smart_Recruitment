"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { usePasswordLogin, useGoogleAuth, useMagicLink } from "@/hooks";
import {
  AuthLayout,
  TabSwitcher,
  SocialAuthSection,
  MagicLinkForm,
  WrongPortalAlert,
} from "@/components/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Lock, ArrowRight, Loader2, UserRound, Eye, EyeOff, Briefcase, Sparkles, Users } from "lucide-react";
import { sanitizeNext, type PortalKind } from "@/lib/portal-roles";

function LoginContent() {
  const [tab, setTab] = useState<"password" | "magic">("password");
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const next = sanitizeNext(searchParams.get("next"));
  const portal: PortalKind | undefined = next?.startsWith("/accept-invite")
    ? undefined
    : "candidate";

  const {
    register,
    handleSubmit,
    setValue,
    errors,
    isPending,
    submitError,
    remember,
    wrongPortal: passwordWrongPortal,
  } = usePasswordLogin(portal, next);

  const {
    handleGoogleLogin,
    isPending: isGooglePending,
    error: googleError,
    setError: setGoogleError,
    wrongPortal: googleWrongPortal,
  } = useGoogleAuth(portal, next);

  const {
    email: magicEmail,
    setEmail: setMagicEmail,
    sent: magicSent,
    loading: magicLoading,
    error: magicError,
    handleSubmit: handleMagicSubmit,
    reset: resetMagic,
  } = useMagicLink("Login", { portal, next: next ?? "/dashboard" });

  const wrongPortal = passwordWrongPortal ?? googleWrongPortal;

  const leftPanelContent = (
    <div className="relative">
      {/* Floating accents (illustrative, aria-hidden) */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-14 hidden rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 font-mono text-[11px] text-white/80 backdrop-blur-sm animate-float xl:block">
        TypeScript • 94% khớp
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute -left-12 top-72 size-24 rounded-full bg-sandgold/15 blur-3xl animate-pulse-soft" />

      <p className="text-xs font-bold uppercase tracking-[0.32em] text-white/50">
        HIREAI
      </p>
      <h1 className="mt-3 max-w-lg text-4xl font-medium tracking-[-0.05em] text-white xl:text-5xl">
        Chào mừng bạn quay trở lại.
      </h1>
      <p className="mt-4 max-w-md text-sm leading-6 text-white/65">
        Đăng nhập để quản lý hồ sơ, CV và theo dõi hành trình ứng tuyển của bạn.
      </p>

      {/* Illustrative stats: placeholders in landing stat-card language */}
      <div className="mt-7 grid max-w-md grid-cols-3 gap-2.5">
        {[
          { icon: Briefcase, tint: "bg-teal/20", iconColor: "text-teal", value: "1.200+", label: "Việc làm IT" },
          { icon: Sparkles, tint: "bg-sandgold/20", iconColor: "text-sandgold", value: "92%", label: "AI match" },
          { icon: Users, tint: "bg-white/10", iconColor: "text-white/80", value: "8.500+", label: "Kết nối" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-3 backdrop-blur-sm">
            <span className={`flex size-8 items-center justify-center rounded-full ${stat.tint}`}>
              <stat.icon className={`size-4 ${stat.iconColor}`} aria-hidden="true" />
            </span>
            <p className="mt-2 font-mono text-base font-bold text-white">{stat.value}</p>
            <p className="mt-0.5 text-[11px] text-white/55">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex max-w-md items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
        <UserRound className="size-5 shrink-0 text-sandgold" />
        <span className="flex-1 text-sm text-white/90">Cổng ứng viên — Nơi kỹ năng gặp đúng cơ hội</span>
      </div>

      <Link
        href="/tao-cv"
        className="mt-4 inline-flex max-w-md items-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/40 hover:bg-white/[0.10]"
      >
        Tạo CV miễn phí <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </div>
  );

  return (
    <AuthLayout leftPanel={leftPanelContent}>
      <div className="mb-4 text-center">
        <div className="mx-auto mb-3 flex w-fit items-center gap-2 rounded-full border border-border bg-muted/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          <UserRound className="size-3" /> Cổng ứng viên
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Đăng nhập ứng viên</h2>
        <p className="mt-1 text-sm text-muted-foreground">Dùng chung hệ thống xác thực HIREAI</p>
      </div>

      {/* Tab Switcher */}
      <TabSwitcher
        tabs={[
          { id: "password", label: "Email & mật khẩu" },
          { id: "magic", label: "Magic Link" },
        ]}
        active={tab}
        onChange={(id) => setTab(id as "password" | "magic")}
      />

      {wrongPortal && (
        <div className="mb-3">
          <WrongPortalAlert portal={wrongPortal} />
        </div>
      )}

      {/* 1. EMAIL & MẬT KHẨU */}
      {tab === "password" && (
        <form onSubmit={handleSubmit} noValidate className="space-y-2.5">
          {submitError && (
            <Alert variant="destructive" className="border-red-200 bg-red-50 py-2.5">
              <AlertDescription className="text-xs text-red-700">{submitError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Email công việc hoặc cá nhân
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="name@company.com"
                {...register("email")}
                disabled={isPending}
                className="h-11 rounded-xl border-input bg-white pl-10 text-sm transition focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Mật khẩu
              </Label>
              <Link href="/forgot-password" className="text-xs text-muted-foreground transition hover:text-foreground hover:underline">
                Quên mật khẩu?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="password"
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

          <div className="flex items-center gap-2 pt-0.5">
            <Checkbox
              id="remember"
              checked={remember}
              onCheckedChange={(checked) => setValue("remember", checked === true)}
              disabled={isPending}
            />
            <Label htmlFor="remember" className="cursor-pointer text-xs text-muted-foreground">
              Lưu thông tin đăng nhập trên thiết bị này
            </Label>
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="mt-1 h-11 w-full rounded-xl bg-primary font-medium text-white transition hover:bg-primary-hover"
          >
            {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ArrowRight className="mr-2 size-4" />}
            {isPending ? "Đang xác thực..." : "Tiếp tục với Email & mật khẩu"}
          </Button>

          <SocialAuthSection
            mode="login"
            onGoogleLogin={handleGoogleLogin}
            onGoogleError={setGoogleError}
            googleError={googleError}
            disabled={isPending || isGooglePending}
          />
        </form>
      )}

      {/* 2. MAGIC LINK */}
      {tab === "magic" && (
        <MagicLinkForm
          email={magicEmail}
          setEmail={setMagicEmail}
          sent={magicSent}
          loading={magicLoading}
          error={magicError}
          onSubmit={handleMagicSubmit}
          onReset={resetMagic}
          buttonText="Gửi Magic Link qua Email"
          label="Email nhận mã truy cập"
        />
      )}

      <div className="mt-5 border-t border-border/60 pt-4 text-center">
        <p className="text-xs text-muted-foreground">
          Chưa có tài khoản HIREAI?{" "}
          <Link href="/register" className="font-semibold text-foreground underline underline-offset-4 hover:opacity-80">
            Đăng ký tài khoản mới
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <LoginContent />
    </Suspense>
  );
}
