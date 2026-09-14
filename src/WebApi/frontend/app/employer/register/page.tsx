"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRegister } from "@refinedev/core";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthLayout } from "@/components/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail, Lock, User, Phone, Building2, MapPin, Briefcase,
  ArrowRight, ArrowLeft, Loader2, Check, Eye, EyeOff,
} from "lucide-react";
import { registerSchema } from "@/lib/schemas";
import {
  IT_SPECIALTIES,
  COMPANY_SIZES,
  SENIORITIES,
} from "@/features/employer/it-taxonomy";
import { cn } from "@/lib/utils";

/**
 * Employer 3-step registration PRESENTATION.
 * Submits through the shared Refine authProvider.register (same backend
 * `POST api/account/register` contract as candidate registration).
 * Step 3 (hiring intent) is onboarding-only and is NOT sent to the
 * register endpoint — it is stored locally and carried to /tin-tuyen-dung.
 */

const employerRegisterSchema = registerSchema.extend({
  linhVucHoatDong: z.string().optional(),
  quyMoNhanSu: z.string().optional(),
  website: z.string().optional(),
  maSoThue: z.string().optional(),
});

type EmployerFormData = z.infer<typeof employerRegisterSchema>;

const STEPS = ["Liên hệ", "Công ty", "Tuyển dụng"] as const;

const STEP1_FIELDS = ["hoTen", "soDienThoai", "email", "password", "confirmPassword"] as const;
const STEP2_FIELDS = ["tenDoanhNghiep", "diaChiDoanhNghiep", "chucVu"] as const;

export default function EmployerRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { mutateAsync: registerMutation, isPending } = useRegister<EmployerFormData>();

  // Step 3 — onboarding-only hiring intent (never sent to register API)
  const [targetSpecialty, setTargetSpecialty] = useState<string>("");
  const [targetSeniority, setTargetSeniority] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [intentNote, setIntentNote] = useState<string>("");

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EmployerFormData>({
    resolver: zodResolver(employerRegisterSchema),
    defaultValues: {
      role: "NGUOI_DAI_DIEN",
      email: "",
      password: "",
      confirmPassword: "",
      hoTen: "",
      soDienThoai: "",
      tenDoanhNghiep: "",
      diaChiDoanhNghiep: "",
      chucVu: "",
      linhVucHoatDong: "",
      quyMoNhanSu: "",
      website: "",
      maSoThue: "",
    },
  });

  const linhVuc = watch("linhVucHoatDong") ?? "";
  const quyMo = watch("quyMoNhanSu") ?? "";

  async function handleNext() {
    setSubmitError(null);
    const fields = step === 0 ? [...STEP1_FIELDS] : [...STEP2_FIELDS];
    const valid = await trigger(fields as Parameters<typeof trigger>[0]);
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function onSubmit(data: EmployerFormData) {
    setSubmitError(null);
    try {
      const result = await registerMutation({
        ...data,
        role: "NGUOI_DAI_DIEN",
      });
      if (!result.success && result.error) {
        setSubmitError(result.error.message ?? "Đăng ký thất bại");
        return;
      }
      if (result.success) {
        // Carry Step-3 intent to the real job-post flow (no fake backend data).
        try {
          sessionStorage.setItem(
            "hireai.employer.intent",
            JSON.stringify({ targetSpecialty, targetSeniority, quantity, intentNote })
          );
        } catch {
          // Storage unavailable — continue without intent carry-over.
        }
        router.replace("/tin-tuyen-dung");
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    }
  }

  return (
    <AuthLayout
      leftPanel={
        <>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-white/60">
            Enterprise Portal / 2026
          </p>
          <h1 className="mt-4 max-w-lg text-4xl font-medium tracking-[-0.05em] text-white xl:text-5xl">
            Tuyển dụng nhân sự công nghệ chuẩn xác & tốc độ.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-white/65">
            Tự động phân loại hồ sơ, đối chiếu Tech Stack và rút ngắn 70% thời gian tuyển chọn dev chất lượng cao.
          </p>
          <ol className="mt-8 space-y-3">
            {STEPS.map((label, i) => (
              <li
                key={label}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-4 backdrop-blur-sm",
                  i < step
                    ? "border-white/10 bg-white/[0.07]"
                    : i === step
                      ? "border-white/20 bg-white/[0.07]"
                      : "border-white/10 bg-white/[0.03]"
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    i < step ? "bg-teal text-white" : i === step ? "bg-white text-primary-hover" : "bg-white/15 text-white/60"
                  )}
                >
                  {i < step ? <Check className="size-4" /> : i + 1}
                </span>
                <span className={cn("text-sm", i <= step ? "text-white/90" : "text-white/50")}>
                  Bước {i + 1}: {label}
                </span>
              </li>
            ))}
          </ol>
        </>
      }
    >
      <div className="mb-5 text-center">
        <div className="mx-auto mb-3 flex w-fit items-center gap-2 rounded-full border border-border bg-muted/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          <Building2 className="size-3" /> Đăng ký nhà tuyển dụng
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Tạo tài khoản doanh nghiệp</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Bước {step + 1}/{STEPS.length}: {STEPS[step]}
        </p>
      </div>

      {/* Stepper */}
      <ol className="mb-5 flex items-center gap-1.5" aria-label="Tiến trình đăng ký">
        {STEPS.map((label, i) => (
          <li key={label} className="flex min-w-0 flex-1 items-center gap-1.5">
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition",
                i < step ? "bg-teal text-white" : i === step ? "bg-primary text-white" : "bg-muted text-muted-foreground"
              )}
              aria-current={i === step ? "step" : undefined}
            >
              {i < step ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span className={cn("truncate text-xs", i === step ? "font-semibold text-foreground" : "text-muted-foreground")}>
              {label}
            </span>
            {i < STEPS.length - 1 && <span className="mx-1 h-px min-w-2 flex-1 bg-border" aria-hidden />}
          </li>
        ))}
      </ol>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        {submitError && (
          <Alert variant="destructive" className="border-red-200 bg-red-50 py-2.5">
            <AlertDescription className="text-xs text-red-700">{submitError}</AlertDescription>
          </Alert>
        )}

        {/* STEP 1 — LIÊN HỆ */}
        {step === 0 && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Họ và tên</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                  <Input {...register("hoTen")} disabled={isPending} placeholder="Nguyễn Văn A" className="h-10 rounded-xl border-input bg-white pl-10 text-sm" />
                </div>
                {errors.hoTen && <p className="text-xs text-red-500">{errors.hoTen.message}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Điện thoại</Label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                  <Input {...register("soDienThoai")} disabled={isPending} placeholder="090 123 4567" className="h-10 rounded-xl border-input bg-white pl-10 text-sm" />
                </div>
                {errors.soDienThoai && <p className="text-xs text-red-500">{errors.soDienThoai.message}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-700">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <Input type="email" {...register("email")} disabled={isPending} placeholder="hr@company.com" className="h-10 rounded-xl border-input bg-white pl-10 text-sm" />
              </div>
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    {...register("password")}
                    disabled={isPending}
                    placeholder="••••••••"
                    className="h-10 rounded-xl border-input bg-white pl-10 pr-9 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    aria-pressed={showPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Nhập lại mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    {...register("confirmPassword")}
                    disabled={isPending}
                    placeholder="••••••••"
                    className="h-10 rounded-xl border-input bg-white pl-10 text-sm"
                  />
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
              </div>
            </div>
          </>
        )}

        {/* STEP 2 — CÔNG TY */}
        {step === 1 && (
          <>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-700">Tên doanh nghiệp</Label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <Input {...register("tenDoanhNghiep")} disabled={isPending} placeholder="Công ty Công nghệ..." className="h-10 rounded-xl border-input bg-white pl-10 text-sm" />
              </div>
              {errors.tenDoanhNghiep && <p className="text-xs text-red-500">{errors.tenDoanhNghiep.message}</p>}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Địa chỉ doanh nghiệp</Label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                  <Input {...register("diaChiDoanhNghiep")} disabled={isPending} placeholder="Số nhà, đường, quận..." className="h-10 rounded-xl border-input bg-white pl-10 text-sm" />
                </div>
                {errors.diaChiDoanhNghiep && <p className="text-xs text-red-500">{errors.diaChiDoanhNghiep.message}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Chức vụ của bạn</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                  <Input {...register("chucVu")} disabled={isPending} placeholder="VD: HR Manager" className="h-10 rounded-xl border-input bg-white pl-10 text-sm" />
                </div>
                {errors.chucVu && <p className="text-xs text-red-500">{errors.chucVu.message}</p>}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Chuyên môn tuyển dụng chính</Label>
                <Select value={linhVuc} onValueChange={(v) => setValue("linhVucHoatDong", v ?? "", { shouldValidate: false })}>
                  <SelectTrigger className="h-10 w-full rounded-xl border-input bg-white text-sm" aria-label="Chuyên môn tuyển dụng chính">
                    <SelectValue placeholder="Chọn nhóm vị trí IT" />
                  </SelectTrigger>
                  <SelectContent className="max-w-[280px]">
                    {IT_SPECIALTIES.map((s) => (
                      <SelectItem key={s} value={s}>
                        <span className="block max-w-[240px] truncate">{s}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Quy mô nhân sự</Label>
                <Select value={quyMo} onValueChange={(v) => setValue("quyMoNhanSu", v ?? "", { shouldValidate: false })}>
                  <SelectTrigger className="h-10 w-full rounded-xl border-input bg-white text-sm" aria-label="Quy mô nhân sự">
                    <SelectValue placeholder="Chọn quy mô" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANY_SIZES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Website (không bắt buộc)</Label>
                <Input {...register("website")} disabled={isPending} placeholder="https://company.com" className="h-10 rounded-xl border-input bg-white text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Mã số thuế (không bắt buộc)</Label>
                <Input {...register("maSoThue")} disabled={isPending} placeholder="0312345678" className="h-10 rounded-xl border-input bg-white text-sm" />
              </div>
            </div>
          </>
        )}

        {/* STEP 3 — NHU CẦU TUYỂN DỤNG (onboarding-only) */}
        {step === 2 && (
          <>
            <p className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-xs leading-5 text-muted-foreground">
              Thông tin dưới đây chỉ giúp gợi ý tin tuyển dụng phù hợp sau khi tài khoản được tạo — không gửi kèm hồ sơ đăng ký.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Nhóm vị trí cần tuyển</Label>
                <Select value={targetSpecialty} onValueChange={(v) => setTargetSpecialty(v ?? "")}>
                  <SelectTrigger className="h-10 w-full rounded-xl border-input bg-white text-sm" aria-label="Nhóm vị trí cần tuyển">
                    <SelectValue placeholder="Chọn nhóm vị trí" />
                  </SelectTrigger>
                  <SelectContent className="max-w-[280px]">
                    {IT_SPECIALTIES.map((s) => (
                      <SelectItem key={s} value={s}>
                        <span className="block max-w-[240px] truncate">{s}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Cấp bậc mục tiêu</Label>
                <Select value={targetSeniority} onValueChange={(v) => setTargetSeniority(v ?? "")}>
                  <SelectTrigger className="h-10 w-full rounded-xl border-input bg-white text-sm" aria-label="Cấp bậc mục tiêu">
                    <SelectValue placeholder="Chọn cấp bậc" />
                  </SelectTrigger>
                  <SelectContent>
                    {SENIORITIES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Số lượng dự kiến</Label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={isPending}
                  placeholder="VD: 3"
                  className="h-10 rounded-xl border-input bg-white text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Ghi chú thêm</Label>
                <Input
                  value={intentNote}
                  onChange={(e) => setIntentNote(e.target.value)}
                  disabled={isPending}
                  placeholder="VD: cần gấp trong Q4"
                  className="h-10 rounded-xl border-input bg-white text-sm"
                />
              </div>
            </div>
          </>
        )}

        {/* Nav buttons */}
        <div className="flex items-center gap-3 pt-1">
          {step > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
              disabled={isPending}
              className="h-11 rounded-xl px-5"
            >
              <ArrowLeft className="mr-2 size-4" /> Quay lại
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={isPending}
              className="h-11 flex-1 rounded-xl bg-primary font-medium text-white transition hover:bg-primary-hover"
            >
              Tiếp tục <ArrowRight className="ml-2 size-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isPending}
              className="h-11 flex-1 rounded-xl bg-primary font-medium text-white transition hover:bg-primary-hover"
            >
              {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Check className="mr-2 size-4" />}
              {isPending ? "Đang tạo tài khoản..." : "Hoàn tất đăng ký"}
            </Button>
          )}
        </div>

      </form>

      <div className="mt-6 border-t border-border/60 pt-4 text-center">
        <p className="text-xs text-muted-foreground">
          Đã có tài khoản doanh nghiệp?{" "}
          <Link href="/employer/login" className="font-semibold text-foreground underline underline-offset-4 hover:opacity-80">
            Đăng nhập
          </Link>
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Bạn là ứng viên?{" "}
          <Link href="/register" className="font-medium text-foreground underline underline-offset-4 hover:opacity-80">
            Đăng ký ứng viên
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
