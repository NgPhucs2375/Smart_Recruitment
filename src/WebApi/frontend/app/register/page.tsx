"use client";

import { useRegister } from "@refinedev/core";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, magicLinkSchema, type RegisterFormData, type MagicLinkFormData } from "@/lib/schemas";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useState } from "react";
// Đảm bảo import hàm requestMagicLink từ API Provider của bạn
import { requestMagicLink } from "@/lib/auth-provider"; 

export default function RegisterPage() {
  const [method, setMethod] = useState<"password" | "magic">("password");

  // ==========================================================================
  // LUỒNG 1: ĐĂNG KÝ BẰNG MẬT KHẨU (TRUYỀN THỐNG)
  // ==========================================================================
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { mutateAsync: registerMutation, isPending } = useRegister<RegisterFormData>();

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

  // ==========================================================================
  // LUỒNG 2: ĐĂNG KÝ BẰNG MAGIC LINK (KHÔNG MẬT KHẨU)
  // ==========================================================================
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
        purpose: "Register", // Cờ định tuyến sang nhánh khởi tạo tài khoản ở Backend
        role: data.role,
        hoTen: data.hoTen,
        // soDienThoai và tenDoanhNghiep có thể được thêm vào payload API nếu backend hỗ trợ
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
    <div className="min-h-screen bg-linear-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Đăng ký tài khoản</h1>
        </div>

        <Card>
          <CardContent className="p-8">
            {/* HỆ THỐNG TABS CHUYỂN ĐỔI PHƯƠNG THỨC */}
            <div className="flex space-x-2 mb-6">
              <Button 
                type="button" 
                variant={method === "password" ? "default" : "outline"} 
                onClick={() => setMethod("password")} 
                className="w-1/2"
              >
                Mật khẩu
              </Button>
              <Button 
                type="button" 
                variant={method === "magic" ? "default" : "outline"} 
                onClick={() => setMethod("magic")} 
                className="w-1/2"
              >
                Email (Không mật khẩu)
              </Button>
            </div>

            {/* HIỂN THỊ FORM TƯƠNG ỨNG */}
            {method === "password" ? (
              <form onSubmit={handlePwdSubmit(onPwdSubmit)} className="space-y-4">
                {submitError && (
                  <Alert variant="destructive">
                    <AlertDescription>{submitError}</AlertDescription>
                  </Alert>
                )}

                <div>
                  <Label>Loại tài khoản</Label>
                  <Select 
                    onValueChange={(val) => setPwdValue("role", val as "UNG_VIEN" | "NGUOI_DAI_DIEN")} 
                    defaultValue="UNG_VIEN"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn vai trò" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNG_VIEN">Ứng Viên</SelectItem>
                      <SelectItem value="NGUOI_DAI_DIEN">Người Đại Diện (Nhà Tuyển Dụng)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedPwdRole === "NGUOI_DAI_DIEN" && (
                  <div>
                    <Label>Tên Doanh Nghiệp</Label>
                    <Input {...registerPwd("companyName")} disabled={isPending} />
                    {pwdErrors.companyName && <p className="text-sm text-destructive mt-1">{pwdErrors.companyName.message}</p>}
                  </div>
                )}

                <div>
                  <Label>Email</Label>
                  <Input type="email" {...registerPwd("email")} disabled={isPending} />
                  {pwdErrors.email && <p className="text-sm text-destructive mt-1">{pwdErrors.email.message}</p>}
                </div>

                <div>
                  <Label>Mật khẩu</Label>
                  <Input type="password" {...registerPwd("password")} disabled={isPending} />
                  {pwdErrors.password && <p className="text-sm text-destructive mt-1">{pwdErrors.password.message}</p>}
                </div>

                <div>
                  <Label>Xác nhận mật khẩu</Label>
                  <Input type="password" {...registerPwd("confirmPassword")} disabled={isPending} />
                  {pwdErrors.confirmPassword && <p className="text-sm text-destructive mt-1">{pwdErrors.confirmPassword.message}</p>}
                </div>

                <Button type="submit" disabled={isPending} className="w-full mt-2">
                  {isPending ? "Đang xử lý..." : "Đăng ký"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleMagicSubmit(onMagicSubmit)} className="space-y-4">
                {magicSent ? (
                  <Alert>
                    <AlertDescription>
                      Hãy mở email để kiểm tra liên kết đăng ký. Vui lòng xem cả hộp thư rác (Spam) nếu không tìm thấy.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    {magicError && (
                      <Alert variant="destructive">
                        <AlertDescription>{magicError}</AlertDescription>
                      </Alert>
                    )}

                    <div>
                      <Label>Loại tài khoản</Label>
                      <Select 
                        onValueChange={(val) => setMagicValue("role", val as "UNG_VIEN" | "NGUOI_DAI_DIEN")} 
                        defaultValue="UNG_VIEN"
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn vai trò" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UNG_VIEN">Ứng Viên</SelectItem>
                          <SelectItem value="NGUOI_DAI_DIEN">Người Đại Diện (Nhà Tuyển Dụng)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Email</Label>
                      <Input type="email" {...registerMagic("email")} disabled={magicLoading} />
                      {magicErrors.email && <p className="text-sm text-destructive mt-1">{magicErrors.email.message}</p>}
                    </div>

                    <div>
                      <Label>Họ và tên</Label>
                      <Input type="text" {...registerMagic("hoTen")} disabled={magicLoading} />
                      {magicErrors.hoTen && <p className="text-sm text-destructive mt-1">{magicErrors.hoTen.message}</p>}
                    </div>

                    <div>
                      <Label>Số điện thoại</Label>
                      <Input type="text" {...registerMagic("soDienThoai")} disabled={magicLoading} />
                      {magicErrors.soDienThoai && <p className="text-sm text-destructive mt-1">{magicErrors.soDienThoai.message}</p>}
                    </div>

                    <Button type="submit" disabled={magicLoading} className="w-full mt-2">
                      {magicLoading ? "Đang xử lý..." : "Nhận liên kết đăng ký"}
                    </Button>
                  </>
                )}
              </form>
            )}

            <div className="text-center mt-4">
              <Link href="/login" className="text-sm text-indigo-600 hover:underline">
                Đã có tài khoản? Đăng nhập ngay
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}