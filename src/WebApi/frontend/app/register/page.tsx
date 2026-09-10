"use client";

import { useState } from "react";
import Link from "next/link";
import { usePasswordRegister, useGoogleAuth, useMagicLinkRegister } from "@/hooks";
import {
  AuthLayout,
  RoleSelector,
  TabSwitcher,
  GoogleAuthSection,
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
  Building2,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  TrendingUp,
  Zap,
} from "lucide-react";

export default function RegisterPage() {
  const [method, setMethod] = useState<"password" | "google" | "magic">("password");
  const [showPassword, setShowPassword] = useState(false);

  // 1. Password Hook
  const {
    register: registerPwd,
    handleSubmit: handlePwdSubmit,
    setValue: setPwdValue,
    errors: pwdErrors,
    isPending: isPwdPending,
    submitError: pwdSubmitError,
    selectedRole: pwdRole,
  } = usePasswordRegister();

  // 2. Google Hook
  const { handleGoogleLogin, isPending: isGooglePending } = useGoogleAuth();

  // 3. Magic Link Hook
  const {
    register: registerMagic,
    handleSubmit: handleMagicSubmit,
    setValue: setMagicValue,
    errors: magicErrors,
    loading: magicLoading,
    sent: magicSent,
    error: magicError,
    selectedRole: magicRole,
    reset: resetMagic,
  } = useMagicLinkRegister();

  const activeRole = method === "magic" ? magicRole : pwdRole;

  const leftPanelContent = (
    <>
      <p className="font-mono text-xs uppercase tracking-[0.24em] text-white/60">
        {activeRole === "NGUOI_DAI_DIEN" ? "Enterprise Portal / 2026" : "Talent Network / 2026"}
      </p>
      <h1 className="mt-4 max-w-lg text-4xl font-medium tracking-[-0.05em] text-white xl:text-5xl">
        {activeRole === "NGUOI_DAI_DIEN"
          ? "Tuyển dụng nhân sự công nghệ chuẩn xác & tốc độ."
          : "Khám phá cơ hội IT xứng tầm năng lực."}
      </h1>
      <p className="mt-5 max-w-md text-sm leading-6 text-white/65">
        {activeRole === "NGUOI_DAI_DIEN"
          ? "Tự động phân loại hồ sơ, đối chiếu Tech Stack và rút ngắn 70% thời gian tuyển chọn dev chất lượng cao."
          : "Hồ sơ của bạn được AI đối chiếu trực tiếp với các dự án thực tế, nhận cơ hội việc làm đúng tech stack."}
      </p>

      <div className="mt-8 space-y-3">
        {activeRole === "NGUOI_DAI_DIEN" ? (
          <>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
              <Zap className="size-5 shrink-0 text-amber-400" />
              <span className="text-sm text-white/90">Sàng lọc và chấm điểm CV tự động bằng mô hình AI</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
              <TrendingUp className="size-5 shrink-0 text-emerald-400" />
              <span className="text-sm text-white/90">Đăng tin không giới hạn và tiếp cận kho kỹ sư mở</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
              <CheckCircle2 className="size-5 shrink-0 text-emerald-400" />
              <span className="text-sm text-white/90">Trình tạo CV chuẩn Tech-Minimalist hoàn toàn miễn phí</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
              <Sparkles className="size-5 shrink-0 text-indigo-400" />
              <span className="text-sm text-white/90">Gợi ý việc làm chuẩn xác từ AI theo ngôn ngữ & framework</span>
            </div>
          </>
        )}
      </div>
    </>
  );

  return (
    <AuthLayout leftPanel={leftPanelContent}>
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex w-fit items-center gap-2 rounded-full border border-[#d8d5ce] bg-[#f4f2ed]/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#69727a]">
          <span className="size-1.5 rounded-full bg-emerald-500" /> Bắt đầu miễn phí
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#151515]">Tạo tài khoản mới</h2>
        <p className="mt-1 text-xs text-[#69727a]">Tham gia hệ sinh thái kết nối công nghệ thông minh</p>
      </div>

      <TabSwitcher
        tabs={[
          { id: "password", label: "Mật khẩu" },
          { id: "google", label: "Google" },
          { id: "magic", label: "Magic Link" },
        ]}
        active={method}
        onChange={(id) => setMethod(id as "password" | "google" | "magic")}
      />

      {/* 1. MẬT KHẨU */}
      {method === "password" && (
        <form onSubmit={handlePwdSubmit} className="space-y-3.5">
          {pwdSubmitError && (
            <Alert variant="destructive" className="border-red-200 bg-red-50 py-2.5">
              <AlertDescription className="text-xs text-red-700">{pwdSubmitError}</AlertDescription>
            </Alert>
          )}

          <RoleSelector
            value={pwdRole ?? "UNG_VIEN"}
            onChange={(role) => setPwdValue("role", role)}
            disabled={isPwdPending}
          />

          {pwdRole === "NGUOI_DAI_DIEN" && (
            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-700">Tên Doanh nghiệp / Tổ chức</Label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <Input
                  {...registerPwd("companyName")}
                  disabled={isPwdPending}
                  placeholder="Công ty Công nghệ..."
                  className="h-10 rounded-xl border-[#d8d5ce] bg-white pl-10 text-sm"
                />
              </div>
              {pwdErrors.companyName && <p className="text-xs text-red-500">{pwdErrors.companyName.message}</p>}
            </div>
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
                  className="h-10 rounded-xl border-[#d8d5ce] bg-white pl-10 text-sm"
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
                  className="h-10 rounded-xl border-[#d8d5ce] bg-white pl-10 text-sm"
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
                placeholder="name@domain.com"
                className="h-10 rounded-xl border-[#d8d5ce] bg-white pl-10 text-sm"
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
                  className="h-10 rounded-xl border-[#d8d5ce] bg-white pl-10 pr-9 text-sm"
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
                  className="h-10 rounded-xl border-[#d8d5ce] bg-white pl-10 text-sm"
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
            className="mt-2 h-11 w-full rounded-xl bg-[#151515] font-medium text-white transition hover:bg-black"
          >
            {isPwdPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ArrowRight className="mr-2 size-4" />}
            {isPwdPending
              ? "Đang khởi tạo tài khoản..."
              : pwdRole === "NGUOI_DAI_DIEN"
              ? "Đăng ký tuyển dụng miễn phí"
              : "Tạo tài khoản ứng viên"}
          </Button>

          {/* Integrated Quick Google Section inside Password Form */}
          <div className="relative my-4 text-center text-xs text-[#69727a]">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#d8d5ce]" /></div>
            <span className="relative bg-[#f4f2ed]/90 px-3 uppercase tracking-wider">hoặc</span>
          </div>

          <GoogleAuthSection
            onGoogleLogin={handleGoogleLogin}
            disabled={isPwdPending || isGooglePending}
            text="Đăng ký nhanh bằng Google"
          />

          <p className="text-center text-[11px] text-[#69727a]">
            Bằng việc tiếp tục, bạn đồng ý với Điều khoản dịch vụ & Chính sách bảo mật.
          </p>
        </form>
      )}

      {/* 2. GOOGLE */}
      {method === "google" && (
        <div className="space-y-4">
          <GoogleAuthSection
            onGoogleLogin={handleGoogleLogin}
            disabled={isGooglePending}
            text="Tiếp tục với Google"
            description="Đăng ký tài khoản nhanh chóng chỉ với một chạm."
          />
        </div>
      )}

      {/* 3. MAGIC LINK */}
      {method === "magic" && (
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

              <RoleSelector
                value={magicRole ?? "UNG_VIEN"}
                onChange={(role) => setMagicValue("role", role)}
                disabled={magicLoading}
              />

              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Họ và tên</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    {...registerMagic("hoTen")}
                    disabled={magicLoading}
                    placeholder="Nguyễn Văn A"
                    className="h-10 rounded-xl border-[#d8d5ce] bg-white pl-10 text-sm"
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
                    className="h-10 rounded-xl border-[#d8d5ce] bg-white pl-10 text-sm"
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
                    className="h-10 rounded-xl border-[#d8d5ce] bg-white pl-10 text-sm"
                  />
                </div>
                {magicErrors.soDienThoai && <p className="text-xs text-red-500">{magicErrors.soDienThoai.message}</p>}
              </div>

              <Button
                type="submit"
                disabled={magicLoading}
                className="mt-2 h-11 w-full rounded-xl bg-[#151515] font-medium text-white transition hover:bg-black"
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

      <div className="mt-6 border-t border-[#d8d5ce]/60 pt-4 text-center">
        <p className="text-xs text-[#69727a]">
          Đã có tài khoản HIRE//AI?{" "}
          <Link href="/login" className="font-semibold text-[#151515] underline underline-offset-4 hover:opacity-80">
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
