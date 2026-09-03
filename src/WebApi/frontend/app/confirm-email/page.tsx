"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function ConfirmEmailContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const code = searchParams.get("code");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    !userId || !code ? "error" : "loading"
  );
  const [message, setMessage] = useState(
    !userId || !code 
      ? "Liên kết xác nhận không hợp lệ hoặc đã hết hạn." 
      : "Đang xác thực email của bạn..."
  );

  useEffect(() => {
    if (!userId || !code) {
      return;
    }

    const confirmEmail = async () => {
      try {
        const res = await fetch(`/api/dotnet/account/confirm-email?userId=${encodeURIComponent(userId)}&code=${encodeURIComponent(code)}`);
        if (res.ok) {
          setStatus("success");
          setMessage("Email của bạn đã được xác thực thành công. Bạn có thể đăng nhập ngay bây giờ.");
        } else {
          setStatus("error");
          setMessage("Xác thực email thất bại. Vui lòng thử lại sau.");
        }
      } catch {
        setStatus("error");
        setMessage("Lỗi kết nối đến máy chủ.");
      }
    };

    confirmEmail();
  }, [userId, code]);

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Xác thực Email</h1>
        
        {status === "loading" && <p className="text-slate-600">{message}</p>}
        
        {status === "success" && (
          <Alert className="bg-green-50 text-green-800 border-green-200">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        
        {status === "error" && (
          <Alert variant="destructive">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {(status === "success" || status === "error") && (
          <div className="w-full mt-6">
            <Link href="/login" className="block w-full">
              <Button className="w-full">Quay lại trang Đăng nhập</Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ConfirmEmailPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <Suspense fallback={<div>Đang tải...</div>}>
        <ConfirmEmailContent />
      </Suspense>
    </div>
  );
}