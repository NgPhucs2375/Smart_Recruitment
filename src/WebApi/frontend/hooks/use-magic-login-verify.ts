"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { magicLogin } from "@/lib/auth-provider";

export function useMagicLoginVerify(token: string | null, email: string | null) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    !token || !email ? "error" : "loading"
  );
  const [message, setMessage] = useState(
    !token || !email
      ? "Liên kết đăng nhập không hợp lệ hoặc thiếu thông tin."
      : "Đang xác thực thông tin đăng nhập..."
  );

  useEffect(() => {
    if (!token || !email) return;

    let isMounted = true;

    const processMagicLogin = async () => {
      try {
        const res = await magicLogin({ email, token });

        if (!isMounted) return;

        if (res.success) {
          setStatus("success");
          setMessage("Đăng nhập thành công. Đang chuyển hướng vào hệ thống...");
          setTimeout(() => {
            router.replace("/dashboard");
          }, 800);
        } else {
          setStatus("error");
          setMessage(res.error || "Xác thực Magic Link thất bại.");
        }
      } catch {
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

  return { status, message };
}
