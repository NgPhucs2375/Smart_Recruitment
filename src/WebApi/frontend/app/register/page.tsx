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
  FileText,
  BellRing,
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
  } = useGoogleAuth("candidate");

  // 3. Magic Link Hook (candidate-only)
  const {
    register: registerMagic,
    handleSubmit: handleMagicSubmit,
    errors: magicErrors,
    loading: magicLoading,
    sent: magicSent,
    error: magicError,
    sentEmail: magicSentEmail,
    reset: resetMagic,
  } = useMagicLinkRegister();

  const leftPanelContent = (
    <div className="relative">
      {/* Decorative glows + floating chips (illustrative, aria-hidden) */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 size-56 rounded-full bg-teal/20 blur-3xl animate-pulse-soft" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-16 top-64 size-44 rounded-full bg-sandgold/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute right-6 top-2 hidden rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 font-mono text-[11px] text-white/80 backdrop-blur-sm animate-float xl:block">
        React • 92% khớp
      </div>

      <p className="font-mono text-xs uppercase tracking-[0.24em] text-white/60">
        Talent Network / 2026
      </p>
      <h1 className="mt-4 max-w-lg text-4xl font-medium tracking-[-0.05em] text-white xl:text-5xl">
        Khám phá cơ hội IT xứng tầm năng lực.
      </h1>
      <p className="mt-5 max-w-md text-sm leading-6 text-white/65">
        Hồ sơ của bạn được AI đối chiếu trực tiếp với các dự án thực tế, nhận cơ hội việc làm đúng tech stack.
      </p>

      {/* Illustrative product mock: numbers are placeholders, not live data */}
      <div className="animate-float mt-8 max-w-md rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
            <Sparkles className="size-3.5 text-teal" /> AI Match
          </p>
          <span className="rounded-full bg-teal/20 px-2.5 py-0.5 font-mono text-[11px] font-bold text-teal">
            92%
          </span>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] text-white/60">
            <span className="flex items-center gap-1.5">
              <FileText className="size-3.5" /> CV của bạn
            </span>
            <span className="font-mono">85%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[85%] rounded-full bg-teal" />
          </div>
        </div>
        <div className="mt-3 space-y-2">
          {[
            { title: "Backend Developer", meta: "React • .NET", match: "94%" },
            { title: "Frontend Developer", meta: "TypeScript • Tailwind", match: "89%" },
          ].map((job) => (
            <div key={job.title} className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.05] px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white/90">{job.title}</p>
                <p className="truncate font-mono text-[10px] text-white/50">{job.meta}</p>
              </div>
              <span className="shrink-0 font-mono text-[11px] font-bold text-teal">{job.match}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 border-t border-white/10 pt-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">
          18 mẫu CV • ATS-friendly
        </p>
      </div>

      <div className="mt-5 max-w-md space-y-2.5">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-sm">
          <CheckCircle2 className="size-5 shrink-0 text-sage" />
          <span className="text-sm text-white/90">Trình tạo CV chuẩn Tech-Minimalist hoàn toàn miễn phí</span>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-sm">
          <Sparkles className="size-5 shrink-0 text-teal" />
          <span className="text-sm text-white/90">Gợi ý việc làm chuẩn xác từ AI theo ngôn ngữ & framework</span>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-sm">
          <BellRing className="size-5 shrink-0 text-sandgold" />
          <span className="text-sm text-white/90">Theo dõi trạng thái ứng tuyển theo thời gian thực</span>
        </div>
      </div>

      <p className="mt-5 max-w-md text-xs leading-5 text-white/45">
        Miễn phí cho ứng viên • Không cần thẻ tín dụng • Xóa tài khoản bất cứ lúc nào
      </p>
    </div>
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
            <MagicLinkSentSuccess email={magicSentEmail} onResend={resetMagic} />
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
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <RegisterContent />
    </Suspense>
  );
}
