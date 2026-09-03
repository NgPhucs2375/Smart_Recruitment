"use client";

import { useLogin, useRegister } from "@refinedev/core";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, magicLinkSchema, type RegisterFormData, type MagicLinkFormData } from "@/lib/schemas";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useState } from "react";
import { requestMagicLink } from "@/lib/auth-provider";
import { Mail, Lock, User, Phone, Building2, ArrowRight, Sparkles, CheckCircle2, Loader2, Briefcase } from "lucide-react";
import { GoogleLoginButton } from "@/components/google-login-button";

export default function RegisterPage() {
  const [method, setMethod] = useState<"password" | "google" | "magic">("password");
  const router = useRouter();

  // LUONG 1: PASSWORD
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { mutateAsync: registerMutation, isPending } = useRegister<RegisterFormData>();
  const { mutateAsync: googleLogin, isPending: isGooglePending } = useLogin();

  const {
    register: registerPwd,
    handleSubmit: handlePwdSubmit,
    setValue: setPwdValue,
    control: pwdControl,
    formState: { errors: pwdErrors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", confirmPassword: "", role: "UNG_VIEN", companyName: "" },
  });

  const selectedPwdRole = useWatch({ control: pwdControl, name: "role" });

  async function onPwdSubmit(data: RegisterFormData) {
    try {
      const result = await registerMutation(data);
      if (!result.success && result.error) {
        setSubmitError(result.error.message ?? "Đăng ký thất bại");
      }

    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    }
  }

  async function handleGoogleRegister(credential: string) {
    setSubmitError(null);
    const result = await googleLogin({ providerName: "google", credential });
    if (!result.success && result.error) {
      setSubmitError(result.error.message ?? "Đăng ký Google thất bại");
    } else if (result.success) {
      router.push("/dashboard");
    }
  }

  // LUONG 2: MAGIC LINK
  const [magicSent, setMagicSent] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicError, setMagicError] = useState<string | null>(null);

  const {
    register: registerMagic,
    handleSubmit: handleMagicSubmit,
    setValue: setMagicValue,
    control: magicControl,
    formState: { errors: magicErrors },
  } = useForm<MagicLinkFormData>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: { email: "", role: "UNG_VIEN", hoTen: "", soDienThoai: "" },
  });

  const selectedMagicRole = useWatch({ control: magicControl, name: "role" });

  async function onMagicSubmit(data: MagicLinkFormData) {
    setMagicLoading(true);
    setMagicError(null);
    try {
      const res = await requestMagicLink({
        email: data.email,
        purpose: "Register",
        role: data.role,
        hoTen: data.hoTen,
      });
      if (res.success) {
        setMagicSent(true);
      } else {
        setMagicError(res.message || "Gửi liên kết thất bại");
      }
    } catch (err) {
      setMagicError(err instanceof Error ? err.message : "Lỗi kết nối");
    } finally {
      setMagicLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f2ed] text-[#202a33] lg:grid lg:grid-cols-2">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex relative min-h-screen overflow-hidden border-r border-[#d8d5ce] bg-[#202a33]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzR6TTMwIDM4djJIMnYtMmgzd00zNiAyNnYySDJ2LTJoMzR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
          <div className="mb-8">
            <div className="mb-10 flex items-center gap-3 text-white">
              <div className="h-3 w-3 rounded-full bg-white" />
              <span className="font-mono text-sm tracking-[0.25em]">HIRE//AI</span>
            </div>
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.24em] text-white/70">Member access / 2026</p>
            <h1 className="max-w-xl text-4xl font-semibold leading-tight text-white xl:text-5xl">Mỗi cơ hội tốt đều bắt đầu từ một kết nối đúng.</h1>
            <p className="mt-6 max-w-md text-base leading-7 text-white/65">Truy cập không gian tuyển dụng được cá nhân hóa bởi dữ liệu, kỹ năng và mục tiêu của bạn.</p>
          </div>

          <div className="hidden">
            {[
              "Tạo CV chuyên nghiệp với AI",
              "Phỏng vấn ảo thông minh",
              "Quản lý hồ sơ ứng viên",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
                <CheckCircle2 className="w-5 h-5 text-green-300 shrink-0" />
                <span className="text-white/90 text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex min-h-screen items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-md rounded-[2rem] border border-[#d8d5ce] bg-white/55 p-6 shadow-[0_24px_80px_rgba(32,42,51,.08)] backdrop-blur-sm sm:p-10">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 bg-[#202a33] rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">CV Consultant AI</h1>
          </div>

          <div className="text-center mb-8">
            <div className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-[#d8d5ce] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#69727a]">
              <span className="size-1.5 rounded-full bg-[#69727a]" /> Create your profile
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-[#202a33]">Tạo tài khoản mới.</h2>
            <p className="mt-3 text-sm text-[#69727a]">Bắt đầu hành trình tuyển dụng thông minh.</p>
          </div>

          {/* Tab Switcher */}
          <div className="grid grid-cols-3 border border-[#d8d5ce] bg-white/60 rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => setMethod("password")}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                method === "password"
                  ? "bg-[#202a33] text-white shadow-sm"
                  : "text-[#69727a] hover:text-[#202a33]"
              }`}
            >
              Mật khẩu
            </button>
            <button
              type="button"
              onClick={() => setMethod("google")}
              className={`rounded-lg px-2 py-2.5 text-sm font-medium transition-all ${
                method === "google" ? "bg-[#202a33] text-white shadow-sm" : "text-[#69727a] hover:text-[#202a33]"
              }`}
            >
              Google
            </button>
            <button
              type="button"
              onClick={() => setMethod("magic")}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                method === "magic"
                  ? "bg-[#202a33] text-white shadow-sm"
                  : "text-[#69727a] hover:text-[#202a33]"
              }`}
            >
              Magic Link
            </button>
          </div>

          {/* Password Form */}
          {method === "password" ? (
            <form onSubmit={handlePwdSubmit(onPwdSubmit)} className="space-y-4">
              {submitError && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">{submitError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Loại tài khoản</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPwdValue("role", "UNG_VIEN")}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      selectedPwdRole === "UNG_VIEN"
                        ? "border-[#202a33] bg-[#202a33] text-white"
                        : "border-[#d8d5ce] bg-white text-[#69727a] hover:border-[#202a33]"
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">Ứng Viên</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPwdValue("role", "NGUOI_DAI_DIEN")}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      selectedPwdRole === "NGUOI_DAI_DIEN"
                        ? "border-[#202a33] bg-[#202a33] text-white"
                        : "border-[#d8d5ce] bg-white text-[#69727a] hover:border-[#202a33]"
                    }`}
                  >
                    <Briefcase className="w-4 h-4" />
                    <span className="text-sm font-medium">Nhà Tuyển Dụng</span>
                  </button>
                </div>
              </div>

              {selectedPwdRole === "NGUOI_DAI_DIEN" && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Tên Doanh Nghiệp</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input {...registerPwd("companyName")} disabled={isPending} placeholder="Công ty ABC" className="pl-10 h-11" />
                  </div>
                  {pwdErrors.companyName && <p className="text-sm text-red-500">{pwdErrors.companyName.message}</p>}
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input type="email" {...registerPwd("email")} disabled={isPending} placeholder="name@example.com" className="pl-10 h-11" />
                </div>
                {pwdErrors.email && <p className="text-sm text-red-500">{pwdErrors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input type="password" {...registerPwd("password")} disabled={isPending} placeholder="••••••••" className="pl-10 h-11" />
                </div>
                {pwdErrors.password && <p className="text-sm text-red-500">{pwdErrors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Xác nhận mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input type="password" {...registerPwd("confirmPassword")} disabled={isPending} placeholder="••••••••" className="pl-10 h-11" />
                </div>
                {pwdErrors.confirmPassword && <p className="text-sm text-red-500">{pwdErrors.confirmPassword.message}</p>}
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-11 bg-[#202a33] hover:bg-black text-white font-medium"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                {isPending ? "Đang xử lý..." : "Đăng ký"}
              </Button>
            </form>
          ) : method === "google" ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-[#d8d5ce] bg-white/60 p-5 text-center">
                <p className="font-medium text-[#202a33]">Tạo tài khoản với Google</p>
                <p className="mt-2 text-sm text-[#69727a]">Không cần nhập lại thông tin đăng ký.</p>
              </div>
              <GoogleLoginButton onSuccess={handleGoogleRegister} disabled={isPending || isGooglePending} text="Đăng ký với Google" />
            </div>
          ) : (
            /* Magic Link Form */
            <form onSubmit={handleMagicSubmit(onMagicSubmit)} className="space-y-4">
              {magicSent ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-[#dededb] rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-[#202a33]" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Kiểm tra email của bạn</h3>
                  <p className="text-gray-500 text-sm">
                    Chúng tôi đã gửi liên kết đăng ký. Vui lòng kiểm tra cả hộp thư rác.
                  </p>
                </div>
              ) : (
                <>
                  {magicError && (
                    <Alert variant="destructive" className="border-red-200 bg-red-50">
                      <AlertDescription className="text-red-700">{magicError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Loại tài khoản</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setMagicValue("role", "UNG_VIEN")}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                          selectedMagicRole === "UNG_VIEN"
                            ? "border-[#202a33] bg-[#202a33] text-white"
                            : "border-[#d8d5ce] bg-white text-[#69727a] hover:border-[#202a33]"
                        }`}
                      >
                        <User className="w-4 h-4" />
                        <span className="text-sm font-medium">Ứng Viên</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMagicValue("role", "NGUOI_DAI_DIEN")}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                          selectedMagicRole === "NGUOI_DAI_DIEN"
                            ? "border-[#202a33] bg-[#202a33] text-white"
                            : "border-[#d8d5ce] bg-white text-[#69727a] hover:border-[#202a33]"
                        }`}
                      >
                        <Briefcase className="w-4 h-4" />
                        <span className="text-sm font-medium">Nhà Tuyển Dụng</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Họ và tên</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input type="text" {...registerMagic("hoTen")} disabled={magicLoading} placeholder="Nguyễn Văn A" className="pl-10 h-11" />
                    </div>
                    {magicErrors.hoTen && <p className="text-sm text-red-500">{magicErrors.hoTen.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input type="email" {...registerMagic("email")} disabled={magicLoading} placeholder="name@example.com" className="pl-10 h-11" />
                    </div>
                    {magicErrors.email && <p className="text-sm text-red-500">{magicErrors.email.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Số điện thoại</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input type="text" {...registerMagic("soDienThoai")} disabled={magicLoading} placeholder="090 123 4567" className="pl-10 h-11" />
                    </div>
                    {magicErrors.soDienThoai && <p className="text-sm text-red-500">{magicErrors.soDienThoai.message}</p>}
                  </div>

                  <Button
                    type="submit"
                    disabled={magicLoading}
                    className="w-full h-11 bg-[#202a33] hover:bg-black text-white font-medium"
                  >
                    {magicLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Mail className="w-4 h-4 mr-2" />
                    )}
                    {magicLoading ? "Đang gửi..." : "Nhận liên kết đăng ký"}
                  </Button>
                </>
              )}
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Đã có tài khoản?{" "}
              <Link href="/login" className="text-[#202a33] underline underline-offset-4 font-medium hover:text-black">
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
