"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BriefcaseBusiness, Building2, CheckCircle2, Loader2, Mail, UserRound } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInvitation } from "@/features/nhan-su/use-invitation";
import { getAuthToken } from "@/lib/auth-provider";

function InvitationContent() {
  const token = useSearchParams().get("token");
  const { status, invitation, message, accepting, sessionRefreshed, accept } = useInvitation(token);
  const loggedIn = Boolean(getAuthToken());
  const returnPath = token ? `/accept-invite?token=${encodeURIComponent(token)}` : "/accept-invite";
  const loginHref = `/login?next=${encodeURIComponent(returnPath)}`;
  const registerHref = token && invitation
    ? `/register?inviteToken=${encodeURIComponent(token)}&email=${encodeURIComponent(invitation.email)}&name=${encodeURIComponent(invitation.hoTen)}`
    : "/register";
  const pending = invitation?.trangThai === "ChoXacNhan";

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-lg rounded-2xl shadow-xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BriefcaseBusiness className="size-6" />
          </div>
          <CardTitle className="text-2xl">Lời mời gia nhập doanh nghiệp</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {status === "loading" && (
            <div className="flex items-center justify-center gap-3 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-5 animate-spin" /> Đang tải thông tin lời mời...
            </div>
          )}

          {status === "error" && (
            <Alert variant="destructive">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {invitation && status !== "loading" && (
            <div className="space-y-3 rounded-xl border bg-muted/30 p-4 text-sm">
              <div className="flex items-center gap-3"><Building2 className="size-4 text-muted-foreground" /><span>{invitation.tenDoanhNghiep || "Doanh nghiệp"}</span></div>
              <div className="flex items-center gap-3"><Mail className="size-4 text-muted-foreground" /><span>{invitation.email}</span></div>
              {invitation.hoTen && <div className="flex items-center gap-3"><UserRound className="size-4 text-muted-foreground" /><span>{invitation.hoTen}</span></div>}
              {invitation.chucVu && <div className="flex items-center gap-3"><BriefcaseBusiness className="size-4 text-muted-foreground" /><span>{invitation.chucVu}</span></div>}
            </div>
          )}

          {status === "ready" && !pending && (
            <Alert>
              <AlertDescription>Lời mời này đã được xử lý và không thể chấp nhận lại.</AlertDescription>
            </Alert>
          )}

          {status === "ready" && pending && !loggedIn && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Đăng nhập bằng đúng email nhận lời mời để tiếp tục.</p>
              <Link href={loginHref} className={buttonVariants({ className: "w-full" })}>Đăng nhập để chấp nhận</Link>
              <p className="text-center text-xs text-muted-foreground">
                Chưa có tài khoản?{" "}
                <Link href={registerHref} className="font-semibold text-foreground underline underline-offset-4">
                  Đăng ký bằng lời mời
                </Link>
              </p>
            </div>
          )}

          {status === "ready" && pending && loggedIn && (
            <div className="space-y-3">
              {message && <Alert variant="destructive"><AlertDescription>{message}</AlertDescription></Alert>}
              <Button className="w-full" disabled={accepting} onClick={() => void accept()}>
                {accepting && <Loader2 className="size-4 animate-spin" />}
                {accepting ? "Đang xác nhận..." : "Chấp nhận lời mời"}
              </Button>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4">
              <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
                <CheckCircle2 className="size-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
              <Link
                href={sessionRefreshed ? "/dashboard" : "/employer/login"}
                className={buttonVariants({ className: "w-full" })}
              >
                {sessionRefreshed ? "Vào trang quản trị" : "Đăng nhập lại để tiếp tục"}
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <InvitationContent />
    </Suspense>
  );
}
