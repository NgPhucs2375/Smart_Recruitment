"use client";

import { useState } from "react";
import Link from "next/link";
import { usePasswordLogin, useGoogleAuth, useMagicLink } from "@/hooks";
import {
  AuthLayout,
  GoogleAuthSection,
  MagicLinkForm,
} from "@/components/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Lock, ArrowRight, Loader2, Quote } from "lucide-react";

export default function LoginPage() {
  const [magicOpen, setMagicOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    errors,
    isPending,
    submitError,
    remember,
  } = usePasswordLogin();

  const { handleGoogleLogin, isPending: isGooglePending } = useGoogleAuth();

  const {
    email: magicEmail,
    setEmail: setMagicEmail,
    sent: magicSent,
    loading: magicLoading,
    error: magicError,
    handleSubmit: handleMagicSubmit,
    reset: resetMagic,
  } = useMagicLink("Login");

  const leftPanelContent = (
    <>
      <p className="font-mono text-xs uppercase tracking-[0.24em] text-white/60">
        Platform Access / 2026
      </p>
      <h1 className="mt-4 max-w-lg text-4xl font-medium tracking-[-0.05em] text-white xl:text-5xl">
        Tuyển dụng có dữ liệu. Quyết định có niềm tin.
      </h1>
      <p className="mt-5 max-w-md text-sm leading-6 text-white/65">
        Không gian kết nối cơ hội công nghệ bằng AI Matching, đối chiếu năng lực theo Tech-stack thực tế.
      </p>

      <div className="mt-8 space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-md">
          <Quote className="mb-2 size-5 text-white/40" />
          <p className="text-sm italic text-white/80">
            &quot;Quy trình bóc tách CV và tính điểm chuẩn xác giúp đội ngũ kỹ thuật tiết kiệm hơn một nửa thời gian lọc ứng viên.&quot;
          </p>
          <div className="mt-3 flex items-center gap-3 border-t border-white/10 pt-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-white/20 font-mono text-xs font-semibold text-white">
              TD
            </div>
            <div>
              <p className="text-xs font-medium text-white">Tech Director</p>
              <p className="text-[11px] text-white/50">Nexora SaaS Platform</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-2xl font-semibold tracking-tight text-white">92%</p>
            <p className="text-xs text-white/60">Độ khớp kỹ năng đề xuất</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-2xl font-semibold tracking-tight text-white">&lt; 48h</p>
            <p className="text-xs text-white/60">Phản hồi hồ sơ trung bình</p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <AuthLayout leftPanel={leftPanelContent}>
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full border border-[#d8d5ce] bg-[#f4f2ed]/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#69727a]">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Cổng truy cập bảo mật
        </div>
        <h2 className="text-3xl font-semibold tracking-tight text-[#151515]">Chào mừng trở lại</h2>
        <p className="mt-2 text-sm text-[#69727a]">Đăng nhập nhanh chóng, không cần chuyển qua lại giữa các phương thức</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {submitError && (
            <Alert variant="destructive" className="border-red-200 bg-red-50 py-2.5">
              <AlertDescription className="text-xs text-red-700">{submitError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-[#69727a]">
              Email công việc hoặc cá nhân
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                {...register("email")}
                disabled={isPending}
                className="h-11 rounded-xl border-[#d8d5ce] bg-white pl-10 text-sm transition focus-visible:ring-1 focus-visible:ring-[#151515]"
              />
            </div>
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-[#69727a]">
                Mật khẩu
              </Label>
              <Link href="/forgot-password" className="text-xs text-[#69727a] transition hover:text-[#151515] hover:underline">
                Quên mật khẩu?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                {...register("password")}
                disabled={isPending}
                className="h-11 rounded-xl border-[#d8d5ce] bg-white pl-10 text-sm transition focus-visible:ring-1 focus-visible:ring-[#151515]"
              />
            </div>
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="remember"
              checked={remember}
              onCheckedChange={(checked) => setValue("remember", checked === true)}
              disabled={isPending}
            />
            <Label htmlFor="remember" className="cursor-pointer text-xs text-[#69727a]">
              Lưu thông tin đăng nhập trên thiết bị này
            </Label>
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="mt-2 h-11 w-full rounded-xl bg-[#151515] font-medium text-white transition hover:bg-black"
          >
            {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ArrowRight className="mr-2 size-4" />}
            {isPending ? "Đang xác thực..." : "Tiếp tục với Mật khẩu"}
          </Button>


        <div className="relative my-1 text-center text-xs text-[#69727a]">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#d8d5ce]" /></div>
          <span className="relative bg-[#f4f2ed]/90 px-3 uppercase tracking-wider">hoặc</span>
        </div>

        <GoogleAuthSection
          onGoogleLogin={handleGoogleLogin}
          disabled={isPending || isGooglePending}
          text="Tiếp tục với Google"
          description="Đăng nhập an toàn không cần ghi nhớ mật khẩu."
        />
      </form>

      <div className="mt-4 rounded-2xl border border-dashed border-[#d8d5ce] bg-[#f4f2ed]/55 p-3">
        <button
          type="button"
          onClick={() => setMagicOpen((open) => !open)}
          className="flex w-full items-center justify-between text-left text-xs font-medium text-[#69727a] transition hover:text-[#151515]"
          aria-expanded={magicOpen}
        >
          <span>Không muốn dùng mật khẩu?</span>
          <span className="font-semibold text-[#151515]">{magicOpen ? "Thu gọn" : "Gửi Magic Link"}</span>
        </button>

        {magicOpen && (
          <div className="mt-4 border-t border-[#d8d5ce]/70 pt-4">
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
          </div>
        )}
      </div>

      <div className="mt-8 border-t border-[#d8d5ce]/60 pt-5 text-center">
        <p className="text-xs text-[#69727a]">
          Chưa có tài khoản HIRE//AI?{" "}
          <Link href="/register" className="font-semibold text-[#151515] underline underline-offset-4 hover:opacity-80">
            Đăng ký tài khoản mới
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
