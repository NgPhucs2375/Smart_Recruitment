"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useMagicLoginVerify } from "@/hooks";
import { WrongPortalAlert } from "@/components/auth";
import { sanitizeNext, type PortalKind } from "@/lib/portal-roles";
import { Loader2 } from "lucide-react";

function MagicLoginContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const rawNext = searchParams.get("next");
  const rawPortal = searchParams.get("portal");
  const portal: PortalKind | undefined =
    rawPortal === "candidate" || rawPortal === "employer" ? rawPortal : undefined;
  const next = sanitizeNext(rawNext);

  const { status, message, wrongPortal } = useMagicLoginVerify(token, email, { portal, next });

  return (
    <Card className="w-full max-w-md rounded-2xl border-border bg-white/90 p-2 shadow-xl backdrop-blur-md">
      <CardContent className="p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold text-foreground mb-2">Xác thực Đăng nhập</h1>

        {status === "loading" && (
          <div className="space-y-4 py-4">
            <Loader2 className="size-8 text-foreground animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        )}

        {status === "success" && (
          <Alert className="bg-emerald-50 text-emerald-800 border-emerald-200">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {status === "error" && (
          <div className="space-y-3 text-left">
            {wrongPortal && <WrongPortalAlert portal={wrongPortal} />}
            <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-700">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          </div>
        )}

        {status === "error" && !wrongPortal && (
          <div className="w-full mt-6">
            <Link href={portal === "employer" ? "/employer/login" : "/login"} className="block w-full">
              <Button className="w-full h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover">
                Quay lại trang Đăng nhập
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MagicLoginPage() {
  return (
    <div className="min-h-dvh bg-background flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-muted-foreground text-sm">Đang tải dữ liệu...</div>}>
        <MagicLoginContent />
      </Suspense>
    </div>
  );
}
