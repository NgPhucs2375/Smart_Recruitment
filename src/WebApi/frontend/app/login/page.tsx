// form Sign In (useLogin)
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SYSTEM_USERS = [
  { email: "administrator@localhost", label: "Administrator", badge: "",                  badgeColor: "" },
  { email: "creator@localhost",       label: "Creator",       badge: "",                  badgeColor: "" },
  { email: "approver@localhost",      label: "Approver",      badge: "",                  badgeColor: "" },
] as const;

const INVOICE_USERS = [
  { email: "accounting@localhost",  label: "Accounting",  badge: "≤ $1,000",       badgeColor: "text-purple-600" },
  { email: "finance@localhost",     label: "Finance",     badge: "$1,001–$10,000", badgeColor: "text-purple-600" },
  { email: "executives@localhost",  label: "Executives",  badge: "> $10,000",      badgeColor: "text-purple-600" },
  { email: "it@localhost",          label: "IT Dept",     badge: "Software/HW",    badgeColor: "text-purple-600" },
] as const;

const REGULATORY_USERS = [
  { email: "reg.reviewer@localhost",   label: "Reg Reviewer",   badge: "Start · Review · Info", badgeColor: "text-blue-600" },
  { email: "reg.manager@localhost",    label: "Reg Manager",    badge: "Mgr Approval",          badgeColor: "text-blue-600" },
  { email: "reg.senior@localhost",     label: "Reg Senior",     badge: "Senior · Final",        badgeColor: "text-blue-600" },
  { email: "reg.compliance@localhost", label: "Reg Compliance", badge: "Compliance",            badgeColor: "text-blue-600" },
  { email: "reg.admin@localhost",      label: "Reg Admin",      badge: "All Reg perms",         badgeColor: "text-emerald-600" },
] as const;

const DEFAULT_PASSWORD = "123456aA@";

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
  const {
    register,
    handleSubmit: rhfSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: DEFAULT_PASSWORD, remember: false },
  });

  useEffect(() => {
    const saved = loadSaved();
    if (saved) reset({ email: saved.email, password: saved.password, remember: true });
    else reset({ email: "", password: DEFAULT_PASSWORD, remember: false });
  }, [reset]);

  const [submitError, setSubmitError] = useState<string | null>(null);

  const { mutateAsync: login, isPending } = useLogin<LoginFormData>();

  const remember = useWatch({ control, name: "remember" });

  async function onSubmit(data: LoginFormData) {
    if (data.remember) {
      saveSaved(data.email, data.password);
    } else {
      clearSaved();
    }

    try {
      const result = await login(data);
      if (!result.success && result.error) {
        setSubmitError(result.error.message ?? "Đăng nhập thất bại");
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Camunda CopilotKit</h1>
          <p className="text-sm text-slate-500 mt-1">Đăng nhập vào hệ thống</p>
        </div>

        <Card>
          <CardContent className="p-8">
            <form onSubmit={rhfSubmit(onSubmit)} noValidate className="space-y-5">
              {submitError && (
                <Alert variant="destructive">
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="email">Email</Label>
                <Select
                  onValueChange={(val) => setValue("email", val as string, { shouldValidate: true })}
                  disabled={isPending}
                >
                  <SelectTrigger id="email" className="w-full">
                    <SelectValue placeholder="Chọn tài khoản…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel className="text-xs text-muted-foreground">Hệ thống</SelectLabel>
                      {SYSTEM_USERS.map((u) => (
                        <SelectItem key={u.email} value={u.email}>
                          <span className="font-medium">{u.label}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{u.email}</span>
                        </SelectItem>
                      ))}
                    </SelectGroup>

                    <SelectSeparator />

                    <SelectGroup>
                      <SelectLabel className="text-xs text-muted-foreground">Invoice Approvers</SelectLabel>
                      {INVOICE_USERS.map((u) => (
                        <SelectItem key={u.email} value={u.email}>
                          <span className="font-medium">{u.label}</span>
                          {u.badge && (
                            <span className={`ml-1 text-xs font-mono ${u.badgeColor}`}>{u.badge}</span>
                          )}
                          <span className="ml-2 text-xs text-muted-foreground">{u.email}</span>
                        </SelectItem>
                      ))}
                    </SelectGroup>

                    <SelectSeparator />

                    <SelectGroup>
                      <SelectLabel className="text-xs text-muted-foreground">Regulatory Approval</SelectLabel>
                      {REGULATORY_USERS.map((u) => (
                        <SelectItem key={u.email} value={u.email}>
                          <span className="font-medium">{u.label}</span>
                          {u.badge && (
                            <span className={`ml-1 text-xs font-mono ${u.badgeColor}`}>{u.badge}</span>
                          )}
                          <span className="ml-2 text-xs text-muted-foreground">{u.email}</span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register("password")}
                  disabled={isPending}
                />
                {errors.password && (
                  <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(checked) => setValue("remember", checked ?? false)}
                  disabled={isPending}
                />
                <Label htmlFor="remember" className="cursor-pointer">
                  Ghi nhớ đăng nhập
                </Label>
              </div>

              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Đang đăng nhập…
                  </>
                ) : (
                  "Đăng nhập"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400 mt-6">
          Clean Architecture · CopilotKit · Camunda BPMN
        </p>
      </div>
    </div>
  );
}
