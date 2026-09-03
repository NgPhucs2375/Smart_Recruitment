"use client";

import { useLogin } from "@refinedev/core";
import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/lib/schemas";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { requestMagicLink } from "@/lib/auth-provider"; 

const SAVED_KEY = "saved_credentials";

function loadSaved(): Pick<LoginFormData, "email" | "password"> | null {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    if (!raw) return null;
    return JSON.parse(atob(raw));
  } catch {
    return null;
  }
}

function saveSaved(email: string, password: string) {
  localStorage.setItem(SAVED_KEY, btoa(JSON.stringify({ email, password })));
}

function clearSaved() {
  localStorage.removeItem(SAVED_KEY);
}

export default function LoginPage() {
  // Trạng thái cho hệ thống Tabs
  const [tab, setTab] = useState<"password" | "magic">("password");

  // Trạng thái cho luồng Magic Link
  const [magicEmail, setMagicEmail] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicError, setMagicError] = useState<string | null>(null);

  // Form đăng nhập mật khẩu
  const {
    register,
    handleSubmit: rhfSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  useEffect(() => {
    const saved = loadSaved();
    if (saved) reset({ email: saved.email, password: saved.password, remember: true });
  }, [reset]);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const { mutateAsync: login, isPending } = useLogin<LoginFormData>();
  const remember = useWatch({ control, name: "remember" });

  async function onSubmit(data: LoginFormData) {
    if (data.remember) saveSaved(data.email, data.password);
    else clearSaved();

    try {
      const result = await login(data);
      if (!result.success && result.error) {
        setSubmitError(result.error.message ?? "Đăng nhập thất bại");
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    }
  }

  // Xử lý gửi Magic Link
  async function handleMagic(e: React.FormEvent) {
    e.preventDefault();
    if (!magicEmail) return;
    
    setMagicLoading(true);
    setMagicError(null);
    
    try {
      const res = await requestMagicLink({ email: magicEmail, purpose: "Login" });
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
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Đăng nhập hệ thống</h1>
          {tab === "password" && <p className="text-sm text-slate-500 mt-1">Gợi ý: admin@localhost / 123456aA@</p>}
        </div>

        <Card>
          <CardContent className="p-8">
            {/* Hệ thống chuyển đổi Tab */}
            <div className="flex space-x-2 mb-6">
              <Button 
                type="button" 
                variant={tab === "password" ? "default" : "outline"} 
                onClick={() => setTab("password")} 
                className="w-1/2"
              >
                Mật khẩu
              </Button>
              <Button 
                type="button" 
                variant={tab === "magic" ? "default" : "outline"} 
                onClick={() => setTab("magic")} 
                className="w-1/2"
              >
                Magic Link
              </Button>
            </div>

            {/* Nội dung Tab Đăng nhập bằng mật khẩu */}
            {tab === "password" ? (
              <form onSubmit={rhfSubmit(onSubmit)} noValidate className="space-y-5">
                {submitError && (
                  <Alert variant="destructive">
                    <AlertDescription>{submitError}</AlertDescription>
                  </Alert>
                )}

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    {...register("email")}
                    disabled={isPending}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="password">Mật khẩu</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register("password")}
                    disabled={isPending}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember"
                      checked={remember}
                      onCheckedChange={(checked) => setValue("remember", checked ?? false)}
                      disabled={isPending}
                    />
                    <Label htmlFor="remember" className="cursor-pointer">Ghi nhớ</Label>
                  </div>
                  <Link href="/register" className="text-sm text-indigo-600 hover:underline">
                    Tạo tài khoản mới
                  </Link>
                </div>

                <Button type="submit" disabled={isPending} className="w-full">
                  {isPending ? "Đang xử lý..." : "Đăng nhập"}
                </Button>
              </form>
            ) : (
              /* Nội dung Tab Đăng nhập bằng Magic Link */
              <form onSubmit={handleMagic} className="space-y-5">
                {magicSent ? (
                  <Alert>
                    <AlertDescription>
                      Hãy mở email <b>{magicEmail}</b> và kiểm tra cả hộp thư rác (Spam) để lấy liên kết đăng nhập.
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
                      <Label htmlFor="magic-email">Email</Label>
                      <Input
                        id="magic-email"
                        type="email"
                        placeholder="name@example.com"
                        value={magicEmail}
                        onChange={(e) => setMagicEmail(e.target.value)}
                        disabled={magicLoading}
                        required
                      />
                    </div>
                    <Button type="submit" disabled={magicLoading} className="w-full">
                      {magicLoading ? "Đang xử lý..." : "Gửi link đăng nhập"}
                    </Button>
                  </>
                )}
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}