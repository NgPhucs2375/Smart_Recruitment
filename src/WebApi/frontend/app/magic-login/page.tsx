"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useMagicLoginVerify } from "@/hooks";
import { Loader2 } from "lucide-react";

function MagicLoginContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const { status, message } = useMagicLoginVerify(token, email);

  return (
    <Card className="w-full max-w-md rounded-2xl border-[#d8d5ce] bg-white/90 p-2 shadow-xl backdrop-blur-md">
      <CardContent className="p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold text-[#151515] mb-2">Xác thực Đăng nhập</h1>

        {status === "loading" && (
          <div className="space-y-4 py-4">
            <Loader2 className="size-8 text-[#151515] animate-spin mx-auto" />
            <p className="text-sm text-[#69727a]">{message}</p>
          </div>
        )}

        {status === "success" && (
          <Alert className="bg-emerald-50 text-emerald-800 border-emerald-200">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {status === "error" && (
          <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-700">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {status === "error" && (
          <div className="w-full mt-6">
            <Link href="/login" className="block w-full">
              <Button className="w-full h-11 rounded-xl bg-[#151515] text-white hover:bg-black">
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
    <div className="min-h-screen bg-[#f4f2ed] flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-[#69727a] text-sm">Đang tải dữ liệu...</div>}>
        <MagicLoginContent />
      </Suspense>
    </div>
  );
}
