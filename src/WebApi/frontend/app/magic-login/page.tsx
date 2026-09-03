"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { magicLogin } from "@/lib/auth-provider"; 

function MagicLoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    !token || !email ? "error" : "loading"
  );
  const [message, setMessage] = useState(
    !token || !email 
      ? "Liên kết đăng nhập không hợp lệ hoặc thiếu thông tin." 
      : "Đang xác thực thông tin đăng nhập..."
  );

  useEffect(() => {
    // Ngăn chặn thực thi nếu thiếu params
    if (!token || !email) return;

    // Cờ kiểm soát vòng đời của component để tránh rò rỉ bộ nhớ
    let isMounted = true; 

    const processMagicLogin = async () => {
      try {
        const res = await magicLogin({ email, token });
        
        if (!isMounted) return;

        if (res.success) {
          setStatus("success");
          setMessage("Đăng nhập thành công. Đang chuyển hướng vào hệ thống...");
          
          // Trì hoãn 800ms để người dùng kịp đọc thông báo trước khi chuyển trang
          setTimeout(() => {
            router.replace("/");
          }, 800);
        } else {
          setStatus("error");
          setMessage(res.error || "Xác thực Magic Link thất bại.");
        }
      } catch (err) {
        if (!isMounted) return;
        setStatus("error");
        setMessage("Lỗi kết nối đến máy chủ.");
      }
    };

    processMagicLogin();

    return () => {
      isMounted = false;
    };
  }, [token, email, router]);

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Xác thực Đăng nhập</h1>
        
        {/* Hiển thị trạng thái chờ */}
        {status === "loading" && (
          <div className="space-y-4">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-600">{message}</p>
          </div>
        )}
        
        {/* Hiển thị thông báo thành công */}
        {status === "success" && (
          <Alert className="bg-green-50 text-green-800 border-green-200">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        
        {/* Hiển thị lỗi */}
        {status === "error" && (
          <Alert variant="destructive">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {/* Nút quay lại chỉ hiển thị khi có lỗi */}
        {status === "error" && (
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

export default function MagicLoginPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      {/* Bao bọc Inner Component bằng Suspense để Next.js xử lý useSearchParams an toàn */}
      <Suspense fallback={<div className="text-slate-600">Đang tải dữ liệu...</div>}>
        <MagicLoginContent />
      </Suspense>
    </div>
  );
}