"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { usePasswordRegister, useGoogleAuth, useMagicLinkRegister } from "@/hooks";
import {
  AuthLayout,
  TabSwitcher,
  SocialAuthSection,
  MagicLinkSentSuccess,
  WrongPortalAlert,
} from "@/components/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  UserRound,
} from "lucide-react";

function RegisterContent() {
  const [method, setMethod] = useState<"password" | "magic">("password");
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("inviteToken");
  const invitedEmail = searchParams.get("email") ?? "";
  const invitedName = searchParams.get("name") ?? "";
  const isInvitation = Boolean(inviteToken);
  const acceptPath = inviteToken
    ? `/accept-invite?token=${encodeURIComponent(inviteToken)}`
    : null;

  // 1. Password Hook (candidate-only, role fixed to UNG_VIEN)
  const {
    register: registerPwd,
    handleSubmit: handlePwdSubmit,
    errors: pwdErrors,
    isPending: isPwdPending,
    submitError: pwdSubmitError,
  } = usePasswordRegister({ inviteToken, email: invitedEmail, hoTen: invitedName });

  // 2. Google — social section only (backend auto-provisions UNG_VIEN)
  const {
    handleGoogleLogin,
    isPending: isGooglePending,
    error: googleError,
    setError: setGoogleError,
    wrongPortal: googleWrongPortal,
  } = useGoogleAuth("candidate");

  // 3. Magic Link Hook (candidate-only)
  const {
    register: registerMagic,
    handleSubmit: handleMagicSubmit,
    errors: magicErrors,
    loading: magicLoading,
    sent: magicSent,
    error: magicError,
    reset: resetMagic,
  } = useMagicLinkRegister();

  const leftPanelContent = (
    <>
      <p className="font-mono text-xs uppercase tracking-[0.24em] text-white/60">
        Talent Network / 2026
      </p>
      <h1 className="mt-4 max-w-lg text-4xl font-medium tracking-[-0.05em] text-white xl:text-5xl">
        Khám phá cơ hội IT xứng tầm năng lực.
      </h1>
      <p className="mt-5 max-w-md text-sm leading-6 text-white/65">
        Hồ sơ của bạn được AI đối chiếu trực tiếp với các dự án thực tế, nhận cơ hội việc làm đúng tech stack.
      </p>

      <div className="mt-8 space-y-3">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
          <CheckCircle2 className="size-5 shrink-0 text-sage" />
          <span className="text-sm text-white/90">Trình tạo CV chuẩn Tech-Minimalist hoàn toàn miễn phí</span>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
          <Sparkles className="size-5 shrink-0 text-indigo-400" />
          <span className="text-sm text-white/90">Gợi ý việc làm chuẩn xác từ AI theo ngôn ngữ & framework</span>
        </div>
      </div>
    </>
  );

  return (
    <AuthLayout leftPanel={leftPanelContent}>
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex w-fit items-center gap-2 rounded-full border border-border bg-muted/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          <UserRound className="size-3" /> {isInvitation ? "Lời mời nhân sự" : "Cổng ứng viên"}
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          {isInvitation ? "Tạo tài khoản nhân sự" : "Tạo tài khoản ứng viên"}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {isInvitation ? "Đăng ký bằng email đã nhận lời mời" : "Tham gia hệ sinh thái kết nối công nghệ thông minh"}
        </p>
      </div>

      {!isInvitation && (
        <TabSwitcher
          tabs={[
            { id: "password", label: "Email & mật khẩu" },
            { id: "magic", label: "Magic Link" },
          ]}
          active={method}
          onChange={(id) => setMethod(id as "password" | "magic")}
        />
      )}

      {googleWrongPortal && (
        <div className="mb-3">
          <WrongPortalAlert portal={googleWrongPortal} />
        </div>
      )}

      {/* 1. EMAIL & MẬT KHẨU */}
      {method === "password" && (
        <form onSubmit={handlePwdSubmit} className="space-y-3.5">
          {pwdSubmitError && (
            <Alert variant="destructive" className="border-red-200 bg-red-50 py-2.5">
              <AlertDescription className="text-xs text-red-700">{pwdSubmitError}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-700">Họ và tên</Label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  {...registerPwd("hoTen")}
                  disabled={isPwdPending}
                  placeholder="Nguyễn Văn A"
                  className="h-10 rounded-xl border-input bg-white pl-10 text-sm"
                />
              </div>
              {pwdErrors.hoTen && <p className="text-xs text-red-500">{pwdErrors.hoTen.message}</p>}
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-700">Số điện thoại</Label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  {...registerPwd("soDienThoai")}
                  disabled={isPwdPending}
                  placeholder="090 123 4567"
                  className="h-10 rounded-xl border-input bg-white pl-10 text-sm"
                />
              </div>
              {pwdErrors.soDienThoai && <p className="text-xs text-red-500">{pwdErrors.soDienThoai.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium text-gray-700">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                  type="email"
                  {...registerPwd("email")}
                  disabled={isPwdPending}
                  readOnly={isInvitation}
                placeholder="name@domain.com"
                className="h-10 rounded-xl border-input bg-white pl-10 text-sm"
              />
            </div>
            {pwdErrors.email && <p className="text-xs text-red-500">{pwdErrors.email.message}</p>}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-700">Mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  {...registerPwd("password")}
                  disabled={isPwdPending}
                  placeholder="••••••••"
                  className="h-10 rounded-xl border-input bg-white pl-10 pr-9 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {pwdErrors.password && <p className="text-xs text-red-500">{pwdErrors.password.message}</p>}
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-700">Xác nhận mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  {...registerPwd("confirmPassword")}
                  disabled={isPwdPending}
                  placeholder="••••••••"
                  className="h-10 rounded-xl border-input bg-white pl-10 text-sm"
                />
              </div>
              {pwdErrors.confirmPassword && (
                <p className="text-xs text-red-500">{pwdErrors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isPwdPending}
            className="mt-2 h-11 w-full rounded-xl bg-primary font-medium text-white transition hover:bg-primary-hover"
          >
            {isPwdPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ArrowRight className="mr-2 size-4" />}
            {isPwdPending
              ? "Đang khởi tạo tài khoản..."
              : isInvitation
                ? "Tạo tài khoản và gia nhập"
                : "Tạo tài khoản ứng viên"}
          </Button>

          {!isInvitation && (
            <SocialAuthSection
              mode="register"
              onGoogleLogin={handleGoogleLogin}
              onGoogleError={setGoogleError}
              googleError={googleError}
              disabled={isPwdPending || isGooglePending}
            />
          )}

          <p className="text-center text-[11px] text-muted-foreground">
            Bằng việc tiếp tục, bạn đồng ý với Điều khoản dịch vụ & Chính sách bảo mật.
          </p>
        </form>
      )}

      {/* 2. MAGIC LINK */}
      {!isInvitation && method === "magic" && (
        <form onSubmit={handleMagicSubmit} className="space-y-3.5">
          {magicSent ? (
            <MagicLinkSentSuccess email={registerMagic("email").name} onResend={resetMagic} />
          ) : (
            <>
              {magicError && (
                <Alert variant="destructive" className="border-red-200 bg-red-50 py-2.5">
                  <AlertDescription className="text-xs text-red-700">{magicError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Họ và tên</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    {...registerMagic("hoTen")}
                    disabled={magicLoading}
                    placeholder="Nguyễn Văn A"
                    className="h-10 rounded-xl border-input bg-white pl-10 text-sm"
                  />
                </div>
                {magicErrors.hoTen && <p className="text-xs text-red-500">{magicErrors.hoTen.message}</p>}
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Email nhận liên kết</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="email"
                    {...registerMagic("email")}
                    disabled={magicLoading}
                    placeholder="name@domain.com"
                    className="h-10 rounded-xl border-input bg-white pl-10 text-sm"
                  />
                </div>
                {magicErrors.email && <p className="text-xs text-red-500">{magicErrors.email.message}</p>}
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Số điện thoại</Label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    {...registerMagic("soDienThoai")}
                    disabled={magicLoading}
                    placeholder="090 123 4567"
                    className="h-10 rounded-xl border-input bg-white pl-10 text-sm"
                  />
                </div>
                {magicErrors.soDienThoai && <p className="text-xs text-red-500">{magicErrors.soDienThoai.message}</p>}
              </div>

              <Button
                type="submit"
                disabled={magicLoading}
                className="mt-2 h-11 w-full rounded-xl bg-primary font-medium text-white transition hover:bg-primary-hover"
              >
                {magicLoading ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 size-4" />
                )}
                {magicLoading ? "Đang xử lý..." : "Nhận liên kết kích hoạt tài khoản"}
              </Button>
            </>
          )}
        </form>
      )}

      <div className="mt-6 border-t border-border/60 pt-4 text-center">
        <p className="text-xs text-muted-foreground">
          Đã có tài khoản HIREAI?{" "}
          <Link
            href={acceptPath ? `/login?next=${encodeURIComponent(acceptPath)}` : "/login"}
            className="font-semibold text-foreground underline underline-offset-4 hover:opacity-80"
          >
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <RegisterContent />
    </Suspense>
  );
}
